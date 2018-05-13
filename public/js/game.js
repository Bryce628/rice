var context = $canvas.getContext('2d');
var gamePieces = {};

socket.on('playerUpdate', updatePlayers);

function updatePlayers(players){
  var playerNames = Object.keys(players);
  playerNames.forEach(function(playerName){
    if(playerName === user) return;
    if(!gamePieces[playerName]){
      createNewPlayer(playerName);
    }
    var player = player[playerName];
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
  console.log(players);
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
  var pieceWidth = Math.min($canvas.width, $canvas.height)/25;
  playerNames.forEach(function(playerName){
    var gamePiece = gamePieces[playerName];
    if(!gamePiece.loaded) return;
    context.drawImage(
      gamePiece.avatar
    , gamePiece.x
    , gamePiece.y
    , pieceWidth, pieceWidth
    );
  })
}

function animate(){
  context.clearRect(0, 0, $canvas.width, $canvas.height);
  drawGamePiece();
  window.requestAnimationFrame(animate);
}

function updatePlayerPosition(e){
  var gamePiece = gamePieces[user];
  var speed = 5;
  switch(e.key){
    case 'ArrowLeft':
      gamePiece.x -= speed;
      break;
    case 'ArrowRight':
      gamePiece.x += speed;
      break;
    case 'ArrowDown':
      gamePiece.y += speed;
      break;
    case 'ArrowUp':
      gamePiece.y -= speed;
      break;
    default:
      return;
  }
  socket.emit('playerUpdate', {x: gamePiece.x, y: gamePiece.y});
}

window.requestAnimationFrame(animate);
createNewPlayer(user);
document.body.addEventListener('keydown', updatePlayerPosition);
