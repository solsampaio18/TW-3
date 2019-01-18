var game = new Board(0, 0, 0, 0, null, null);
var offGame = new _Board(0, 0, 0, 0, null, 4);
var user = new User(null, null, 19, null);
var oppColor = null;
var type = null;

var url = "http://twserver.alunos.dcc.fc.up.pt:8119/";

function Board(row, col, turn, tie, b, gameID) {
  this.row = row;
  this.col = col;
  this.turn = turn;
  this.tie = tie;
  this.b = b;
  this.gameID = gameID;
}

function _Board(row, col, turn, tie, b, depth) {
  this.row = row;
  this.col = col;
  this.turn = turn;
  this.tie = tie;
  this.b = b;
  this.depth = depth;
}

function User(username, password, group, color) {
  this.username = username;
  this.password = password;
  this.group = group;
  this.color = color;
}

////////////////////////// SERVER COMMUNICATION //////////////////////////

function start() {
  var hIndex = document.getElementById("height");
  game.row = hIndex.options[hIndex.selectedIndex].value;
  offGame.row = hIndex.options[hIndex.selectedIndex].value;

  var wIndex = document.getElementById("width");
  game.col = wIndex.options[wIndex.selectedIndex].value;
  offGame.col = wIndex.options[wIndex.selectedIndex].value;

  var starter = document.getElementById("starter");
  type = starter.options[starter.selectedIndex].value;
  console.log(type);


  if (type === "0") {
    if (document.getElementById("onlineClass").getAttribute("style")) {
      document.getElementById("onlineClass").removeAttribute("style");
      document.getElementById("offlineClass").style.display = "none";
    }
    if (document.getElementById("onlineQuit").getAttribute("style")) {
      document.getElementById("onlineQuit").removeAttribute("style");
      document.getElementById("offlineQuit").style.display = "none";
    }
    hideClick();
    join();
    game.b = emptyBoard();
  } else if (type === "1") {
    document.getElementById("loadingCanvas").style.display = "none";
    offlineGame();
    offGame.turn = 0;
    offGame.b = emptyBoard();
    //showOffTable();
    if (document.getElementById("offlineClass").getAttribute("style")) {
      document.getElementById("offlineClass").removeAttribute("style");
      document.getElementById("onlineClass").style.display = "none";
    }
    if (document.getElementById("offlineQuit").getAttribute("style")) {
      document.getElementById("offlineQuit").removeAttribute("style");
      document.getElementById("onlineQuit").style.display = "none";
    }
  }
}

function showOffTable() {
  if (typeof (Storage) !== "undefined") {
    if (localStorage.getItem("currG") === null) {
      localStorage.setItem("currG", 0);
      localStorage.setItem("currWAi", 0);
      localStorage.setItem("currLAi", 0);
      localStorage.setItem("currWHu", 0);
      localStorage.setItem("currLHu", 0);
    }
    document.getElementById("test").rows[1].cells[1].innerHTML = localStorage.getItem("currG");
    document.getElementById("test").rows[2].cells[1].innerHTML = localStorage.getItem("currG");
    document.getElementById("test").rows[1].cells[2].innerHTML = localStorage.getItem("currWHu");
    document.getElementById("test").rows[2].cells[2].innerHTML = localStorage.getItem("currWAi");
    document.getElementById("test").rows[1].cells[3].innerHTML = localStorage.getItem("currLHu");
    document.getElementById("test").rows[2].cells[3].innerHTML = localStorage.getItem("currLAi");
    document.getElementById("test").rows[1].cells[4].innerHTML = (parseInt(localStorage.getItem("currWHu")) / parseInt(localStorage.getItem("currG")) * 100).toFixed(1) + "%";
    document.getElementById("test").rows[2].cells[4].innerHTML = (parseInt(localStorage.getItem("currWAi")) / parseInt(localStorage.getItem("currG")) * 100).toFixed(1) + "%";
  }
  show('Page2', 'Page1');
}

function login() {
  username = document.getElementById("username").value;
  password = document.getElementById("password").value;
  x = {
    "nick": username,
    "pass": password
  };

  fetch(url + "register", {
    method: "POST",
    body: JSON.stringify(x),
  })
    .then(_login);
}

function _login(response) {
  if (response.status >= 200 && response.status < 300) {
    user.username = document.getElementById("username").value;
    user.password = document.getElementById("password").value;
    return show('Page1', 'Page0');
  } else {
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("error").style.display = "block";
    return;
  }
}

function join() {
  boardSize = {
    "rows": Number(game.row),
    "columns": Number(game.col)
  };
  x = JSON.stringify({
    "group": user.group,
    "nick": user.username,
    "pass": user.password,
    "size": boardSize
  });
  //console.log(x);
  fetch(url + "join", {
    method: "POST",
    body: x,
  })
    .then(_join_)
    .then(_join);
}

function _join_(response) {
  if (response.status >= 200 && response.status < 300) {
    return response.json();
  }
}

function _join(response) {
  //console.log(response.game);
  game.gameID = response.game;
  //console.log(game.gameID);
  restartGame();
  document.getElementById("board").style.display = "none";
  if (document.getElementById("loadingCanvas").hasAttribute("style")) {
    document.getElementById("loadingCanvas").removeAttribute("style");
  }
  showloading();
  update();
  var pai = document.getElementById("showturn");
  pai.innerHTML = "Esperando por um jogo!";
}

function update() {

  eventSource = new EventSource(url + "update?nick=" + user.username + "&game=" + game.gameID);

  eventSource.onmessage = function (event) {
    var data = JSON.parse(event.data);
    console.log(data);

    if (data.column == null || data.column == undefined) {
      document.getElementById("board").removeAttribute("style");
      document.getElementById("loadingCanvas").style.display = "none";
      if (data.turn == user.username) {
        showClick();
        user.color = "yellow";
        oppColor = "red";
        game.turn = 0;
        var pai = document.getElementById("showturn");
        pai.innerHTML = "Jogada: " + data.turn;
      } else {
        user.color = "red";
        oppColor = "yellow";
        game.turn == 1;
        var pai = document.getElementById("showturn");
        pai.innerHTML = "Jogada: " + data.turn;
        hideClick();
      }
    }

    if (data.column != null || data.column != undefined) {
      if (data.turn == user.username) {
        showClick();
        console.log(data.turn);
        var pai = document.getElementById("showturn");
        pai.innerHTML = "Jogada: " + data.turn;
        makePlay(data.column);
      } else if (data.turn != user.username) {
        hideClick();
        console.log(data.turn);
        var pai = document.getElementById("showturn");
        pai.innerHTML = "Jogada: " + data.turn;
      }
      if (data.winner != undefined) {
        eventSource.close();
        if (data.winner != user.username) {
          makePlay(data.column);
        }
        if (data.winner != null) {
          var pai = document.getElementById("showturn");
          pai.innerHTML = "Vencedor: " + data.winner;
        } else {
          var pai = document.getElementById("showturn");
          pai.innerHTML = "Vencedor: Empate!";
        }
      }
    }
    if (data.winner != undefined) {
      eventSource.close();
      var pai = document.getElementById("showturn");
      pai.innerHTML = "Vencedor: " + data.winner;
    }
    if (data.winner === null) {
      var pai = document.getElementById("showturn");
      pai.innerHTML = "Empate!";
      eventSource.close();
      //document.getElementById("board").style.display = "none";
    }
  }

  eventSource.onerror = function (event) {
    console.log("ERROR");
  }
}

function leave() {
  x = JSON.stringify({
    "nick": user.username,
    "pass": user.password,
    "game": game.gameID
  });
  //console.log(x);
  fetch(url + "leave", {
    method: "POST",
    body: x
  })
    .then(function (response) {
      return response.json();
    })
}

function notify(col) {
  x = JSON.stringify({
    "nick": user.username,
    "pass": user.password,
    "game": game.gameID,
    "column": col
  });

  fetch(url + "notify", {
    method: "POST",
    body: x
  })
    .then(_notify);
}

function _notify(response) {
  if (response.status >= 200 && response.status < 300) {
    //console.log(response);
  } else {
    //console.log(response.statusText);
  }
}

function ranking() {
  boardSize = {
    "size": {
      "rows": Number(game.row),
      "columns": Number(game.col)
    }
  };
  x = JSON.stringify(boardSize);

  show('Page7', 'Page1');
  fetch(url + "ranking", {
    method: "POST",
    body: x
  })
    .then(_ranking_)
    .then(_ranking);
}

function _ranking_(response) {
  if (response.status >= 200 && response.status < 300) {
    return response.json();
  }
}

function _ranking(response) {
  if (response.ranking != undefined) {
    //console.log(response.ranking.length);
    var json = response.ranking;
    var test =
      "<table id=test_>" +
      "<tr>" +
      "<th>Jogador</th>" +
      "<th>Número de Jogos</th>" +
      "<th>Número de Vitórias</th>" +
      "<th>Número de Derrotas</th>" +
      "<th>Percentagem de Vitórias</th>" +
      "</tr>";


    for (var j = 0; j < json.length; j++) {

      test +=
        "<tr>" +
        "<td>" + json[j].nick + "</td>" +
        "<td>" + json[j].games + "</td>" +
        "<td>" + json[j].victories + "</td>" +
        "<td>" + (json[j].games - json[j].victories) + "</td>" +
        "<td>" + ((json[j].victories / json[j].games) * 100).toFixed(1) + "%" + "</td>";
      test += "</tr>";
    }

    test +=
      "</table>" +
      "</div>";

    document.getElementById("table_on").innerHTML = test;
  } else {
    document.getElementById("table_on").innerHTML = "Classificações indisponíveis ou vazias";
  }

}
//////////////////////////////////////////////////////////////////////////////

function showloading() {
  var c = document.getElementById('loadingCanvas'),
    ctx = c.getContext('2d'),
    pi = Math.PI,
    xCenter = c.width / 2,
    yCenter = c.height / 2,
    radius = c.width / 3,
    startSize = radius / 3,
    num = 5,
    posX = [],
    posY = [],
    angle, size, i;

  window.setInterval(function () {
    num++;
    ctx.clearRect(0, 0, xCenter * 2, yCenter * 2);
    for (i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(30,144,255,' + .1 * i + ')';
      if (posX.length == i) {
        angle = pi * i * .25;
        posX[i] = xCenter + radius * Math.cos(angle);
        posY[i] = yCenter + radius * Math.sin(angle);
      }
      ctx.arc(
        posX[(i + num) % 8],
        posY[(i + num) % 8],
        startSize / 9 * i,
        0, pi * 2, 1);
      ctx.fill();
    }
  }, 100);
};

function restartGame() {
  var filho = document.getElementById("board");
  var pai = document.getElementById("container");
  while (document.getElementById("board") != null) {
    pai.removeChild(filho);
  }

  var board = document.createElement("div");
  board.id = "board";
  document.getElementById("container").appendChild(board);

  for (var i = 0; i < game.row; i++) {
    var rows = document.createElement("div");
    rows.classList.add("row");
    rows.id = i;
    document.getElementById("board").appendChild(rows);
    for (var j = 0; j < game.col; j++) {
      var cols = document.createElement("div");
      cols.classList.add("col");
      cols.id = "col_" + i + "_" + j;
      cols.classList.add("empty");
      cols.onclick = function () {
        var empty = findEmpty(this.id, game.row);
        var colName = "col_" + empty + "_" + this.id.slice(6);
        notify(this.id.slice(6));
        if (game.turn == 0) {
          if (empty != -1) {
            document.getElementById(colName).classList.add(user.color);
            if (document.getElementById(colName).classList.contains("over")) {
              document.getElementById(colName).classList.remove("over");
            }
            game.b[empty][this.id.slice(6)] = 'O';
            game.turn = 1;
            game.tie++;
            checkIfWin(game.row, game.col);
            /*if (game.tie == (game.row * game.col) && checkIfWin(game.row, game.col) == false) {
              var msg = document.getElementById("Page4");
              msg.style.display = "block";
              removeClick();
            }*/
          }

        }
      };
      cols.onmouseover = function () {
        over(this.id, game.row);
      }
      cols.onmouseout = function () {
        notover(this.id, game.row);
      }
      rows.appendChild(cols);
    }
  }
  return;
}

function offlineGame() {
  var filho = document.getElementById("board");
  var pai = document.getElementById("container");
  while (document.getElementById("board") != null) {
    pai.removeChild(filho);
  }
  showClick();
  var board = document.createElement("div");
  board.id = "board";
  document.getElementById("container").appendChild(board);
  if (offGame.turn == 1) {
    showTurn(0);
  } else if (offGame.turn == 0) {
    showTurn(0);
  }
  for (var i = 0; i < offGame.row; i++) {
    var rows = document.createElement("div");
    rows.classList.add("row");
    rows.id = i;
    document.getElementById("board").appendChild(rows);
    for (var j = 0; j < offGame.col; j++) {
      var cols = document.createElement("div");
      cols.classList.add("col");
      cols.id = "col_" + i + "_" + j;
      cols.classList.add("empty");
      cols.onclick = function () {
        var empty = findEmpty(this.id, offGame.row);
        var colName = "col_" + empty + "_" + this.id.slice(6);
        //console.log(colName);
        showTurn(0);
        //notify(this.id.slice(6));
        //console.log(offGame.turn);
        if (offGame.turn === 0) {
          //console.log(colName);
          if (empty != -1) {
            document.getElementById(colName).classList.add("yellow");
            //console.log(colName);
            if (document.getElementById(colName).classList.contains("over")) {
              document.getElementById(colName).classList.remove("over");
            }
            offGame.b[empty][this.id.slice(6)] = 'O';
            offGame.turn = 1;
            offGame.tie++;
            checkIfWin(offGame.row, offGame.col);
            setTimeout(showTurn, 1000, 0);
            if (offGame.tie == (offGame.row * offGame.col) && checkIfWin(offGame.row, offGame.col) == false) {
              //var msg = document.getElementById("Page4");
              //msg.style.display = "block";
              console.log("WIN");
              hidec
              _removeClick();
            }
          }
        }
        if (offGame.turn == 1) {
          showTurn(1);
          if (!checkIfWin(offGame.row, offGame.col)) {
            setTimeout(minimax, 1000);
          }
          if (offGame.tie == (offGame.row * offGame.col) && checkIfWin(offGame.row, offGame.col) == false) {
            //var msg = document.getElementById("Page6");
            //msg.style.display = "block";
            console.log("WIN");
            _removeClick();
          }
        }
      };
      cols.onmouseover = function () {
        over(this.id, offGame.row);
      }
      cols.onmouseout = function () {
        notover(this.id, offGame.row);
      }
      rows.appendChild(cols);
    }
  }
  return;
}

function over(id, rows) {
  for (var i = 0; i < rows; i++) {
    var colName = "col_" + i + "_" + id.slice(6);
    if (document.getElementById(colName).classList.contains("empty")) {
      document.getElementById(colName).classList.add("over");
    }
  }
}

function notover(id, rows) {
  for (var i = 0; i < rows; i++) {
    var colName = "col_" + i + "_" + id.slice(6);
    if (document.getElementById(colName).classList.contains("empty")) {
      document.getElementById(colName).classList.remove("over");
    }
  }
}

function show(shown, hidden) {
  document.getElementById(shown).style.display = 'block';
  document.getElementById(hidden).style.display = 'none';
  return false;
}

function hide(id) {
  document.getElementById(id).style.display = 'none';
}

function showTurn(turn) {
  if (turn == 1) {
    var pai = document.getElementById("showturn");
    pai.innerHTML = "Jogada: Computador";
  } else if (turn == 0) {
    var pai = document.getElementById("showturn");
    pai.innerHTML = "Jogada: " + user.username;
  }
}

function emptyBoard() {
  b = [];
  for (var i = 0; i < game.row; i++) {
    b[i] = [];
    for (var j = 0; j < game.col; j++) {
      b[i][j] = '-';
    }
  }
  return b;
}

function cloneBoard(board) {
  var clone = [];
  for (var i = 0; i < game.row; i++) {
    clone[i] = [];
    for (var j = 0; j < game.col; j++) {
      clone[i][j] = '-';
    }
  }
  for (var i = 0; i < game.row; i++) {
    for (var j = 0; j < game.col; j++) {
      clone[i][j] = board[i][j];
    }
  }
  return clone;
}

function addPiece(colN, rows) {
  for (var i = rows - 1; i >= 0; i--) {
    var id = "col_" + i + "_" + colN;
    if (document.getElementById(id).classList.contains("empty")) {
      document.getElementById(id).classList.remove("empty");
      document.getElementById(id).classList.add("red");
      return i;
    }
  }
  return -1;
}

function removePiece(colN, rowN) {
  var id = "col_" + rowN + "_" + colN;
  document.getElementById(id).classList.add("empty");
  document.getElementById(id).classList.remove("red");
}

function quit() {
  removeClick();
  showWinner("ai");
  updateTable("ai");
}

function updateTable(player) {
  var currG = parseInt(localStorage.getItem("currG"));
  var currWAi = parseInt(localStorage.getItem("currWAi"));
  var currLAi = parseInt(localStorage.getItem("currLAi"));
  var currWHu = parseInt(localStorage.getItem("currWHu"));
  var currLHu = parseInt(localStorage.getItem("currLHu"));
  /*if (player === "ai") {
  var currG = parseInt(document.getElementById("test").rows[1].cells[1].innerHTML);
  /*if (typeof(Storage) !== "undefined") {
    localStorage.setItem("currG", 0);

    document.getElementById("test")document.getElementById("test").rows[2].cells[1].innerHTML = localStorage.getItem("currG") + 1;
    document.getElementById("test")document.getElementById("test").rows[2].cells[1].innerHTML = localStorage.getItem("currG") + 1;

  }*/
  if (player === "ai") {
    localStorage.currG = parseInt(localStorage.currG) + 1;
    localStorage.currWAi = parseInt(localStorage.currWAi) + 1;
    localStorage.currLHu = parseInt(localStorage.currLHu) + 1;
    console.log(localStorage.currG + " " + localStorage.currWAi + " " + localStorage.currLHu);
  } else {
    localStorage.currG = parseInt(localStorage.currG) + 1;
    localStorage.currWHu = parseInt(localStorage.currWHu) + 1;
    localStorage.currLAi = parseInt(localStorage.currLAi) + 1;
  }
}

function findEmpty(x, rows) {
  var colN = x.slice(6);
  for (var i = rows - 1; i >= 0; i--) {
    var id = "col_" + i + "_" + colN;
    if (document.getElementById(id).classList.contains("empty")) {
      document.getElementById(id).classList.remove("empty");
      return i;
    }
  }
  return -1;
}

function _findEmpty(x, rows) {

  for (var i = rows - 1; i >= 0; i--) {
    var id = "col_" + i + "_" + x;
    if (document.getElementById(id).classList.contains("empty")) {
      document.getElementById(id).classList.remove("empty");
      return i;
    }
  }
  return -1;
}

function removeClick() {
  for (var i = 0; i < game.row; i++) {
    for (var j = 0; j < game.col; j++) {
      var id = "col_" + i + "_" + j;
      var element = document.getElementById(id);
      element.classList.add('noclick');
      element.onclick = function () {
        return false;
      }
    }
  }
}

function _removeClick() {
  for (var i = 0; i < offGame.row; i++) {
    for (var j = 0; j < offGame.col; j++) {
      var id = "col_" + i + "_" + j;
      var element = document.getElementById(id);
      element.classList.add('noclick');
      element.onclick = function () {
        return false;
      }
    }
  }
}

function showWinner(player) {
  if (player === "ai") {
    var pai = document.getElementById("showturn");
    pai.innerHTML = "Vencedor: Computador";
    //  var msg = document.getElementById("Page4");
    //msg.style.display = "block";

    hideClick();
    _removeClick();
    return;
  } else {
    var pai = document.getElementById("showturn");
    pai.innerHTML = "Vencedor: " + user.username;
    //var msg = document.getElementById("Page5");
    //msg.style.display = "block";
    _removeClick();
    hideClick();
    return;
  }
}

function hideClick() {
  document.getElementById("noclick").removeAttribute("style");
}

function showClick() {
  document.getElementById("noclick").style.display = 'none';
}

function makePlay(column) {
  var empty = _findEmpty(column, game.row);
  var colName = "col_" + empty + "_" + column;
  if (empty != -1) {
    document.getElementById(colName).classList.add(oppColor);
    if (document.getElementById(colName).classList.contains("over")) {
      document.getElementById(colName).classList.remove("over");
    }
    game.b[empty][column] = 'X';
    game.turn = 0;
    game.tie++;
    checkIfWin(game.row, game.col);
  }
}

function checkIfWin(a, b) {
  var yellowC = false;
  var redC = false;
  var ai = "ai";
  var human = "human";
  for (var i = a - 1; i >= 0; i--) {
    for (var j = 0; j < b - 3; j++) {
      var id = "col_" + i + "_" + j;
      var id2 = "col_" + i + "_" + (j + 1);
      var id3 = "col_" + i + "_" + (j + 2);
      var id4 = "col_" + i + "_" + (j + 3);
      if (document.getElementById(id).classList.contains("red") && document.getElementById(id2).classList.contains("red") &&
        document.getElementById(id3).classList.contains("red") && document.getElementById(id4).classList.contains("red")) {
        showWinner(ai);
        updateTable(ai);
        return true;
      }
      if (document.getElementById(id).classList.contains("yellow") && document.getElementById(id2).classList.contains("yellow") &&
        document.getElementById(id3).classList.contains("yellow") && document.getElementById(id4).classList.contains("yellow")) {
        showWinner(human);
        updateTable(human);
        return true;
      }
    }
  }

  for (var i = 0; i < b; i++) {
    for (var j = a - 1; j >= a - 3; j--) {
      var id = "col_" + j + "_" + i;
      var id2 = "col_" + (j - 1) + "_" + i;
      var id3 = "col_" + (j - 2) + "_" + i;
      var id4 = "col_" + (j - 3) + "_" + i;
      if (document.getElementById(id).classList.contains("red") && document.getElementById(id2).classList.contains("red") &&
        document.getElementById(id3).classList.contains("red") && document.getElementById(id4).classList.contains("red")) {
        showWinner(ai);
        updateTable(ai);
        return true;
      }
      if (document.getElementById(id).classList.contains("yellow") && document.getElementById(id2).classList.contains("yellow") &&
        document.getElementById(id3).classList.contains("yellow") && document.getElementById(id4).classList.contains("yellow")) {
        showWinner(human);
        updateTable(human);
        return true;
      }

      if (j - 4 < 0) {
        break;
      }
    }
  }
  for (var i = a - 1; i > 2; i--) {
    for (var j = 0; j < b - 3; j++) {
      var id = "col_" + i + "_" + j;
      var id2 = "col_" + (i - 1) + "_" + (j + 1);
      var id3 = "col_" + (i - 2) + "_" + (j + 2);
      var id4 = "col_" + (i - 3) + "_" + (j + 3);

      if (document.getElementById(id).classList.contains("red") && document.getElementById(id2).classList.contains("red") &&
        document.getElementById(id3).classList.contains("red") && document.getElementById(id4).classList.contains("red")) {
        showWinner(ai);
        updateTable(ai);
        return true;
      }
      if (document.getElementById(id).classList.contains("yellow") && document.getElementById(id2).classList.contains("yellow") &&
        document.getElementById(id3).classList.contains("yellow") && document.getElementById(id4).classList.contains("yellow")) {
        showWinner(human);
        updateTable(human);
        return true;

      }
    }
  }

  for (var i = 0; i < a - 3; i++) {
    for (var j = 0; j < b - 3; j++) {
      var id = "col_" + i + "_" + j;
      var id2 = "col_" + (i + 1) + "_" + (j + 1);
      var id3 = "col_" + (i + 2) + "_" + (j + 2);
      var id4 = "col_" + (i + 3) + "_" + (j + 3);

      if (document.getElementById(id).classList.contains("red") && document.getElementById(id2).classList.contains("red") &&
        document.getElementById(id3).classList.contains("red") && document.getElementById(id4).classList.contains("red")) {
        showWinner(ai);
        updateTable(ai);
        return true;

      }
      if (document.getElementById(id).classList.contains("yellow") && document.getElementById(id2).classList.contains("yellow") &&
        document.getElementById(id3).classList.contains("yellow") && document.getElementById(id4).classList.contains("yellow")) {
        showWinner(human);
        updateTable(human);
        return true;

      }
    }
  }
  return false;
}

/////////////////////////////////////// Minimax

function findUtil(s, colN, rows) {
  for (var i = rows - 1; i >= 0; i--) {
    if (s[i][colN] == '-') {
      return i;
    }
  }
  return -1;
}

function addPiece(colN, rows) {
  for (var i = rows - 1; i >= 0; i--) {
    var id = "col_" + i + "_" + colN;
    if (document.getElementById(id).classList.contains("empty")) {
      document.getElementById(id).classList.remove("empty");
      document.getElementById(id).classList.add("red");
      return i;
    }
  }
  return -1;
}

function removePiece(colN, rowN) {
  var id = "col_" + rowN + "_" + colN;
  document.getElementById(id).classList.add("empty");
  document.getElementById(id).classList.remove("red");
}

function minimax() {
  var v;
  v = max(offGame.b, 0);
  if (aiMove == -1) {
    for (var i = 0; i < offGame.col; i++) {
      var free = findUtil(offGame.b, i, offGame.row);
      if (free != -1) {
        aiMove = i;
        break;
      }
    }
  }
  var empty = findUtil(offGame.b, aiMove, offGame.row);
  var colName = "col_" + empty + "_" + aiMove;
  document.getElementById(colName).classList.add("red");
  if (document.getElementById(colName).classList.contains("over")) {
    document.getElementById(colName).classList.remove("over");
  }
  document.getElementById(colName).classList.remove("empty");
  offGame.b[empty][aiMove] = 'X';
  offGame.turn = 0;
  offGame.tie++;
  checkIfWin(offGame.row, offGame.col);
  aiMove = -1;
}

function max(clone, depth) {
  if (depth == offGame.depth) {
    return utilityVal(clone);
  }
  var v = -99999;
  var max = -99999;

  for (var i = 0; i < offGame.col; i++) {

    if (findUtil(clone, i, offGame.row) == -1) {
      break;
    }

    var s = cloneBoard(clone);
    var empty = findUtil(s, i, offGame.row);
    s[empty][i] = 'X';
    v = Math.max(v, min(s, depth + 1));
    if (v > max) {
      max = v;
      aiMove = i;
    }
  }
  return v;
}

function min(clone, depth) {
  if (depth == offGame.depth) {
    return utilityVal(clone);
  }
  var v = 99999;
  for (var i = 0; i < offGame.col; i++) {

    if (findUtil(clone, i, offGame.row) == -1) {
      break;
    }
    var s = cloneBoard(clone);
    var empty = findUtil(s, i, offGame.row);
    s[empty][i] = 'O';
    v = Math.min(v, max(s, depth + 1));
  }
  return v;
}

function utilityVal(board) {
  var totalUtility = 0;
  var nReds = 0;
  var nYellows = 0;
  //horizontal
  for (var i = offGame.row - 1; i >= 0; i--) {
    for (var j = 0; j < offGame.col - 3; j++) {
      if (board[i][j] != 'O' && board[i][j + 1] != 'O' && board[i][j + 2] != 'O' && board[i][j + 3] != 'O') {
        if (board[i][j] == 'X') {
          nReds++;
        }
        if (board[i][j + 1] == 'X') {
          nReds++;
        }
        if (board[i][j + 2] == 'X') {
          nReds++;
        }
        if (board[i][j + 3] == 'X') {
          nReds++;
        }
        if (nReds == 1) {
          totalUtility = totalUtility + 1;
        }
        if (nReds == 2) {
          totalUtility = totalUtility + 10;
        }
        if (nReds == 3) {
          totalUtility = totalUtility + 50;
        }
        if (nReds == 4) {
          totalUtility = totalUtility + 512;
        }
        nReds = 0;
      }

      if (board[i][j] != 'X' && board[i][j + 1] != 'X' && board[i][j + 2] != 'X' && board[i][j + 3] != 'X') {
        if (board[i][j] == 'O') {
          nYellows++;
        }
        if (board[i][j + 1] == 'O') {
          nYellows++;
        }
        if (board[i][j + 2] == 'O') {
          nYellows++;
        }
        if (board[i][j + 3] == 'O') {
          nYellows++;
        }
        if (nYellows == 1) {
          totalUtility = totalUtility - 1;
        }
        if (nYellows == 2) {
          totalUtility = totalUtility - 10;
        }
        if (nYellows == 3) {
          totalUtility = totalUtility - 50;
        }
        if (nYellows == 4) {
          totalUtility = totalUtility - 512;
        }
        nYellows = 0;
      }
    }
  }

  //vertical
  for (var i = 0; i < offGame.col; i++) {
    for (var j = offGame.row - 1; j >= offGame.row - 3; j--) {
      if (board[j][i] != 'O' && board[j - 1][i] != 'O' && board[j - 2][i] != 'O' && board[j - 3][i] != 'O') {
        if (board[j][i] == 'X') {
          nReds++;
        }
        if (board[j - 1][i] == 'X') {
          nReds++;
        }
        if (board[j - 2][i] == 'X') {
          nReds++;
        }
        if (board[j - 3][i] == 'X') {
          nReds++;
        }
        if (nReds == 1) {
          totalUtility = totalUtility + 1;
        }
        if (nReds == 2) {
          totalUtility = totalUtility + 10;
        }
        if (nReds == 3) {
          totalUtility = totalUtility + 50;
        }
        if (nReds == 4) {
          totalUtility = totalUtility + 512;
        }
        nReds = 0;
      }

      if (board[j][i] != 'X' && board[j - 1][i] != 'X' && board[j - 2][i] != 'X' && board[j - 3][i] != 'X') {
        if (board[j][i] == 'O') {
          nYellows++;
        }
        if (board[j - 1][i] == 'O') {
          nYellows++;
        }
        if (board[j - 2][i] == 'O') {
          nYellows++;
        }
        if (board[j - 3][i] == 'O') {
          nYellows++;
        }
        if (nYellows == 1) {
          totalUtility = totalUtility - 1;
        }
        if (nYellows == 2) {
          totalUtility = totalUtility - 10;
        }
        if (nYellows == 3) {
          totalUtility = totalUtility - 50;
        }
        if (nYellows == 4) {
          totalUtility = totalUtility - 512;
        }
        nYellows = 0;
      }
      if (j - 4 < 0) {
        break;
      }
    }
  }

  //diagonal1
  for (var i = offGame.row - 1; i > 2; i--) {
    for (var j = 0; j < offGame.col - 3; j++) {
      if (board[i][j] != 'O' && board[i - 1][j + 1] != 'O' && board[i - 2][j + 2] != 'O' && board[i - 3][j + 3] != 'O') {
        if (board[i][j] == 'X') {
          nReds++;
        }
        if (board[i - 1][j + 1] == 'X') {
          nReds++;
        }
        if (board[i - 2][j + 2] == 'X') {
          nReds++;
        }
        if (board[i - 3][j + 3] == 'X') {
          nReds++;
        }
        if (nReds == 1) {
          totalUtility = totalUtility + 1;

        }
        if (nReds == 2) {
          totalUtility = totalUtility + 10;
        }
        if (nReds == 3) {
          totalUtility = totalUtility + 50;
        }
        if (nReds == 4) {
          totalUtility = totalUtility + 512;
        }
        nReds = 0;
      }

      if (board[i][j] != 'X' && board[i - 1][j + 1] != 'X' && board[i - 2][j + 2] != 'X' && board[i - 3][j + 3] != 'X') {
        if (board[i][j] == 'O') {
          nYellows++;
        }
        if (board[i - 1][j + 1] == 'O') {
          nYellows++;
        }
        if (board[i - 2][j + 2] == 'O') {
          nYellows++;
        }
        if (board[i - 3][j + 3] == 'O') {
          nYellows++;
        }
        if (nYellows == 1) {
          totalUtility = totalUtility - 1;
        }
        if (nYellows == 2) {
          totalUtility = totalUtility - 10;
        }
        if (nYellows == 3) {
          totalUtility = totalUtility - 50;
        }
        if (nYellows == 4) {
          totalUtility = totalUtility - 512;
        }
        nYellows = 0;
      }
    }
  }

  //diagonal2
  for (var i = 0; i < offGame.row - 3; i++) {
    for (var j = 0; j < offGame.col - 3; j++) {
      if (board[i][j] != 'O' && board[i + 1][j + 1] != 'O' && board[i + 2][j + 2] != 'O' && board[i + 3][j + 3] != 'O') {
        if (board[i][j] == 'X') {
          nReds++;
        }
        if (board[i + 1][j + 1] == 'X') {
          nReds++;
        }
        if (board[i + 2][j + 2] == 'X') {
          nReds++;
        }
        if (board[i + 3][j + 3] == 'X') {
          nReds++;
        }
        if (nReds == 1) {
          totalUtility = totalUtility + 1;

        }
        if (nReds == 2) {
          totalUtility = totalUtility + 10;
        }
        if (nReds == 3) {
          totalUtility = totalUtility + 50;
        }
        if (nReds == 4) {
          totalUtility = totalUtility + 512;
        }
        nReds = 0;
      }

      if (board[i][j] != 'X' && board[i + 1][j + 1] != 'X' && board[i + 2][j + 2] != 'X' && board[i + 3][j + 3] != 'X') {
        if (board[i][j] == 'O') {
          nYellows++;
        }
        if (board[i + 1][j + 1] == 'O') {
          nYellows++;
        }
        if (board[i + 2][j + 2] == 'O') {
          nYellows++;
        }
        if (board[i + 3][j + 3] == 'O') {
          nYellows++;
        }
        if (nYellows == 1) {
          totalUtility = totalUtility - 1;
        }
        if (nYellows == 2) {
          totalUtility = totalUtility - 10;
        }
        if (nYellows == 3) {
          totalUtility = totalUtility - 50;
        }
        if (nYellows == 4) {
          totalUtility = totalUtility - 512;
        }
        nYellows = 0;
      }
    }
  }
  return totalUtility;
}
