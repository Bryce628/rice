var context = $canvas.getContext('2d');
var gamePieces = {};
var pieceWidth = Math.min($canvas.width, $canvas.height)/30;
var gamePiece;

var cookieImage = new Image();
cookieImage.src = '/img/cookie.png'
var r = $canvas.width/5;
var cookieX = $canvas.width/2 - r;
var cookieY = $canvas.height/2 - r*5/4;
var cookiePixels;
var cookieBites = {};
var bitesToSendToServer = {};
var eventTimeout = 0;
var isGameOver = false;

socket.on('playerUpdate', updatePlayers);
socket.on('drawBites', function(bites){
  Object.keys(bites).forEach(function(biteKey) {
    //Return out of function if bite has already been added
    if(cookieBites[biteKey]) return;
    cookieBites[biteKey] = 1;
  })
});

function updatePlayers(players){
  var playerNames = Object.keys(players);
  playerNames.forEach(function(playerName){
    if(playerName === user) return;
    if(!gamePieces[playerName]){
      createNewPlayer(playerName);
    }
    var player = players[playerName];
    var gamePiece = gamePieces[playerName];
    gamePiece.x = player.x;
    gamePiece.y = player.y;
  })
  var gamePiecesNames = Object.keys(gamePieces);
  gamePiecesNames.forEach(function(gamePieceName){
    if(!players[gamePieceName]){
      delete gamePieces[gamePieceName]
    };
  });
}

function createNewPlayer(playerName){
  var gamePiece = {loaded: false, x: 0, y: 0};
  gamePiece.avatar = new Image();
  gamePiece.avatar.onload = function(){
    gamePiece.loaded = true;
  }
  gamePiece.avatar.src ='/picture/' + playerName;
  gamePieces[playerName] = gamePiece;
}

function drawGamePiece(){
  var playerNames = Object.keys(gamePieces);
  playerNames.forEach(function(playerName){
    gamePiece = gamePieces[playerName];
    if(!gamePiece.loaded) return;
    context.drawImage(
      gamePiece.avatar
    , gamePiece.x
    , gamePiece.y
    , pieceWidth, pieceWidth
    );
  })
}

function drawCookie(){
	context.drawImage(cookieImage, cookieX, cookieY, 2*r , 2*r);
}

function getCookiePixels(){
  var imageData = context.getImageData(x-r*2,y-r*5/4, 2*r, 2*r);
  var x = 0;
  var y = 0;
  var p = 0;
  var pixel = 0;
  var pixelCount = imageData.data.length/4;
  var size = 2 * r;
  var hasNonWhitePixel = false;
  cookiePixels = [];
  while(pixel < pixelCount){
    var red = imageData.data[p++];
    var green = imageData.data[p++];
    var blue = imageData.data[p++];
    var alpha = imageData.data[p++];
    y = pixel % size;
    x = Math.floor(pixel/size);
    xp = x + cookieX;
    yp = y + cookieY;

    var arr = [red, green, blue, alpha];
    cookiePixels[xp] = cookiePixels[xp] || [];
    cookiePixels[xp][yp] = [red, green, blue, alpha];
    if(red !== 255 || green !== 255 || blue !== 255){
      if(alpha === 255){
        hasNonWhitePixel = true;
      }
    }
    pixel++;
  }
  isGameOver = !hasNonWhitePixel;
}

function isPlayerTouchingCookie(){
  //var cookiePixelsUnderneathAvatar = {};
  var collides = 0;
  for(var avatarX = gamePiece.x; avatarX < pieceWidth + gamePiece.x; avatarX++){
    for(var avatarY = gamePiece.y; avatarY < pieceWidth + gamePiece.y; avatarY++){
      var pixel = (cookiePixels[avatarX] || [])[avatarY];
      if(pixel && pixel.length === 4) {
        takeABite();
        return;
      }
    }
  }
  // if(cookiePixelsUnderneathAvatar.length == 4){
  //   takeABite();
  // }
  // console.log(cookiePixelsUnderneathAvatar);
}

function drawBite(){
  Object.keys(cookieBites).forEach(function(cookieBiteKey){
    var cookieBite = JSON.parse(cookieBiteKey);
    context.beginPath();
    context.arc(cookieBite.x, cookieBite.y, cookieBite.r, 0, 2*Math.PI);
    context.fillStyle = 'white';
    context.fill();
  })
}

function takeABite(){
  var bite = {
    x: gamePiece.x + pieceWidth/2,
    y: gamePiece.y + pieceWidth/2,
    r: pieceWidth,
    user: user
  }
  var biteKey = JSON.stringify(bite);
  if(!cookieBites[biteKey]) cookieBites[biteKey] = 1;
  bitesToSendToServer[biteKey] = 1;
  socket.emit("bites", bitesToSendToServer);
  bitesToSendToServer = {};
}

function announceWinner(){
  var playerCount = {};
  Object.keys(cookieBites).forEach(function(cookieBiteKey){
    var cookieBite = JSON.parse(cookieBiteKey);
    var player = cookieBite.user;
    if(!playerCount[player]){
      playerCount[player] = 0;
    }
    playerCount[player]++;
  })
  alert(JSON.stringify(playerCount));
}

function animate(){
  context.clearRect(0, 0, $canvas.width, $canvas.height);
  if(isGameOver === true){
    announceWinner();
    return;
  }
  drawCookie();
  drawBite();
  getCookiePixels();
  drawGamePiece();
  isPlayerTouchingCookie();
  window.requestAnimationFrame(animate);
}

function updatePlayerPosition(e){
  var gamePiece = gamePieces[user];
  var xSpeed = $canvas.width / 40;
  var ySpeed = $canvas.height / 40;
  switch(e.key){
    case 'ArrowLeft':
      gamePiece.x -= xSpeed;
      break;
    case 'ArrowRight':
      gamePiece.x += xSpeed;
      break;
    case 'ArrowDown':
      gamePiece.y += ySpeed;
      break;
    case 'ArrowUp':
      gamePiece.y -= ySpeed;
      break;
    default:
      return;
  }
  socket.emit('playerUpdate', {x: gamePiece.x, y: gamePiece.y});
}

cookieImage.onload = function(){
    window.requestAnimationFrame(animate);
}
createNewPlayer(user);
document.body.addEventListener('keydown', updatePlayerPosition);
