param(
  [int]$Port = 9224,
  [int]$DurationSeconds = 30,
  [switch]$Reload
)

$ErrorActionPreference = 'Stop'
$targets = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/json/list" -TimeoutSec 5
$target = @($targets | Where-Object { $_.type -eq 'page' })[0]
if (-not $target) {
  throw "No page target is available on WebView2 debugging port $Port."
}

$socket = [System.Net.WebSockets.ClientWebSocket]::new()
$socket.ConnectAsync([Uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
$nextId = 0

function Send-CdpCommand {
  param(
    [Parameter(Mandatory)]
    [string]$Method,
    [hashtable]$Params = @{}
  )

  $script:nextId += 1
  $payload = @{
    id = $script:nextId
    method = $Method
    params = $Params
  } | ConvertTo-Json -Compress -Depth 20
  $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
  $segment = [ArraySegment[byte]]::new($bytes)
  $socket.SendAsync(
    $segment,
    [System.Net.WebSockets.WebSocketMessageType]::Text,
    $true,
    [Threading.CancellationToken]::None
  ).GetAwaiter().GetResult()
}

Send-CdpCommand -Method 'Runtime.enable'
Send-CdpCommand -Method 'Log.enable'
Send-CdpCommand -Method 'Network.enable'
Send-CdpCommand -Method 'Page.enable'
if ($Reload) {
  Send-CdpCommand -Method 'Page.reload' -Params @{ ignoreCache = $true }
}

$interestingMethods = @(
  'Runtime.exceptionThrown',
  'Runtime.consoleAPICalled',
  'Log.entryAdded',
  'Network.loadingFailed',
  'Network.webSocketFrameError',
  'Page.javascriptDialogOpening'
)
$deadline = [DateTimeOffset]::UtcNow.AddSeconds($DurationSeconds)
$buffer = New-Object byte[] 1048576
$message = [IO.MemoryStream]::new()
$receiveTask = $null

try {
  while ([DateTimeOffset]::UtcNow -lt $deadline -and $socket.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
    if (-not $receiveTask) {
      $segment = [ArraySegment[byte]]::new($buffer)
      $receiveTask = $socket.ReceiveAsync($segment, [Threading.CancellationToken]::None)
    }
    if (-not $receiveTask.Wait(250)) {
      continue
    }
    $result = $receiveTask.GetAwaiter().GetResult()
    $receiveTask = $null
    if ($result.MessageType -eq [System.Net.WebSockets.WebSocketMessageType]::Close) {
      break
    }
    $message.Write($buffer, 0, $result.Count)
    if (-not $result.EndOfMessage) {
      continue
    }
    $json = [Text.Encoding]::UTF8.GetString($message.ToArray())
    $message.SetLength(0)
    $event = $json | ConvertFrom-Json
    if ($interestingMethods -contains $event.method) {
      $json
    }
  }
}
finally {
  $message.Dispose()
  $socket.Dispose()
}
