
var settings = {
  height : 500,
  width : 800,
  enemyR: 7,
  cannonR : 25,
  bulletRX: 7,
  bulletRY: 14,
  numEnemies : 10,
  enemyMovementSpeed: 1000
}

var Enemy = function(x, y){
  this.x = x;
  this.y = y;
  this.color = "red";
  this.isDead = false;
}

var Cannon = function(x, y){
  this.x = x;
  this.y = y;
  this.color = "red";
}

function Bullet(x, y) {
  this.x = x;
  this.y = y;
  this.color = "red";
}

//Loop through number of enemies and populate a new enemy at a random x and y coordinate
var populateEnemies = function(){
  var x;//random x
  var y;//enemies start off the screen then drop in
  for (var i = 0; i < settings.numEnemies; i++){
    x = 0 - (Math.floor(Math.random() * (settings.width * 2)));
    y = 0 - (Math.floor(Math.random() * (settings.height * 2)));
    x *= (Math.round(Math.random()) * 2 - 1);
    y *= (Math.round(Math.random()) * 2 - 1);
    if (x > 0 && x < settings.width){
      x *= -1;
    }
    if (y > 0 && y < settings.height){
      y *= -1;
    }
    var newEnemy = new Enemy(x, y);
    enemyArray.push(newEnemy);  //push new enemies into array in order to easily access their data in D3
  }

  //Paint all enemies on screen as SVG circles
  svg.selectAll('circle').data(enemyArray).enter()
      .append('circle')
      .attr('class', 'enemy alive')
      .attr("r", settings.enemyR + "px")
      .attr("cx", function(d, i){ return d.x; })
      .attr("cy", function(d, i){ return d.y; })
      .attr('fill', 'black');

  //Drop enemies onto play area
  svg.selectAll('.enemy').data(enemyArray)
      .transition().ease('elastic').duration(1500)
      .attr("cy", function(d, i){
        d.y = Math.floor(Math.random() * (settings.height - 50) + 50);
        return d.y;
      })
      .attr("cx", function(d, i){
        d.x = Math.floor(Math.random() * (settings.width - 50) + 50);
        return d.x;
      });
}

//Create the cannon
var populateCannon = function(){
  var cannon = new Cannon(settings.width / 2, settings.height);  //Create the cannon
  cannonArray.push(cannon);  //Push the cannon into a global array to easily access with D3

  //Print to screen
  svg.selectAll('.player').data(cannonArray).enter()
     .append('circle')
   .attr('class', 'player')
     .attr("r", settings.cannonR)
     .attr("cx", function(d, i){ return d.x; })
     .attr("cy", function(d, i){ return d.y; })
     .attr('fill', function(d, i){ return d.color; });
}

//Function called at an interval from main game loop
//Moves all enemies to a new random position on the screen
var moveEnemies = function() {

  //Transition all enemies to a new random location
  svg.selectAll('.enemy').filter('.alive').data(enemyArray)
     .transition().duration(settings.enemyMovementSpeed).ease('linear')
     .attr('cx', function(d, i){
        //if(d.isDead === false){
          d.x = Math.floor(Math.random() * ((settings.width - settings.enemyR) - 50) + 50);
        //}
          return d.x;
      })
     .attr('cy', function(d, i){
        //if(d.isDead === false){
          d.y = Math.floor(Math.random() * ((settings.height - 100) - 50) + 50);
        //}
          return d.y;
      })
     .tween('Set x & y properties', function(d, i){  //Run checkCollision at each step in the transition to register collisions while transitioning
        return function(t) {  //t is the percentage of the way through the transition
          //if(d.isDead === false){
            d.x = d3.select(this).attr('cx');
            d.y = d3.select(this).attr('cy');
          //}
     }
     });
}

var checkCollision = function(){
  //get distances between objects
  for (var i = 0; i < enemyArray.length; i++){
    var dx = currentBullet.x - enemyArray[i].x;
    var dy = currentBullet.y - enemyArray[i].y;
    var distance = Math.sqrt(dx * dx + dy * dy);

    //check if the objects are close enough to be touching
    if (distance <= 45 + settings.enemyR){
      //set all enemies within range to dead
      enemyArray[i].isDead = true;
      deadArray.push(enemyArray[i]);
    }
  }

  killEnemies();
}

var killEnemies = function(){

  svg.selectAll('.enemy').data(enemyArray)
    .classed('alive', function(d){
      //if enemy is dead, give it class .dead and set y coordinates to bottom of screen
      if(d.isDead === false){
        return true;
      } else {
        return false;
      }
    }).classed('dead', function(d){
      if(d.isDead === false){
        return false;
      } else {
        return true;
      }
    });

  //svg.selectAll('.dead').remove();

  svg.selectAll('circle').filter('.dead').data(deadArray)
    .transition().duration(750).ease('bounce')
    .attr('cy', function(d){
      d.y = settings.height - settings.enemyR;
      return d.y;
    });

  //svg.selectAll('.dead').data(deadArray).transition().duration(1000).ease('bounce')
    //.attr('cy', function(d){ return d.y; });
}

//----GLOBAL VARIABLES----
d3.select('.gameSpace').append("svg");
var svg = d3.select('svg').attr("height", settings.height).attr("width", settings.width);
var gameScreen = d3.select('.gameSpace').style("height", settings.height + "px").style("width", settings.width + "px");


var enemyArray = [];
var cannonArray = [];  //d3 accepts arrays as data arguments so push the player object into an array even though there is only one of them
var bulletArray = [];
var deadArray = [];
var currentBullet;

//----MAIN GAME FUNCTION----
var startGame = function() {

  var mouseCoordinates = [0, 0];     //d3 coordinates are stored in an array, [x, y]
  var timeBetweenEnemyMoves = 1000;  //Time between each time the enemies move to a new location in ms
  populateEnemies(settings.numEnemies);
  populateCannon();                  //Create the player and paint to screen
  var player = cannonArray[0];

  setInterval(function(){ moveEnemies(); }, timeBetweenEnemyMoves);

  d3.select('.gameSpace').on('click', function(d){
    var mouseCoordinates = d3.mouse(this);
    mouseX = mouseCoordinates[0];
    mouseY = mouseCoordinates[1];
    //shoot bullet in direction of mouse
    fireBullet(mouseX, mouseY);
    moveBullets(mouseX, mouseY);
  });

  d3.timer(function(){

  });
}

startGame();

var fireBullet = function(targetX, targetY){
  currentBullet = new Bullet(settings.playerX, settings.playerY);
  bulletArray.push(currentBullet);

  //paint bullet to screen
  svg.selectAll('ellipse').data(bulletArray).enter()
      .append('ellipse')
      .attr('class', 'bullet')
      .attr("cx", function(d, i){ return cannonArray[0].x; })
      .attr("cy", function(d, i){ return cannonArray[0].y; })
      .attr("rx", function(d, i){ return settings.bulletRX; })
      .attr("ry", function(d, i){ return settings.bulletRY; })
      .attr('fill', 'black');
}

var moveBullets = function(targetX, targetY){
  d3.select('body').selectAll('.bullet').data(bulletArray).transition().duration(300).ease('linear')
    .attr("cx", targetX)
    .attr("cy", targetY)
    .tween('Set x and y properties', function(d, i){
      return function(t){
        d.x = d3.select(this).attr('cx');
        d.y = d3.select(this).attr('cy');
      }
    })
    .remove().each('end', function(d, i){
      if(i === bulletArray.length - 1){
        checkCollision();
        screenShake(d);
      }
    });
}

var screenShake = function(d) {
  //if (playerDead === false){
    gameScreen.transition().duration(50).style({
      'top' : '7px',
      'left' : '7px'
    }).transition().duration(50).style({
      'top' : '0px',
      'left' : '0px'
    }).transition().duration(50).style({
      'top' : '7px',
      'left' : '7px'
    }).transition().duration(50).style({
      'top' : '-7px',
      'left' : '-7px'
    }).transition().duration(50).style({
      'top' : '7px',
      'left' : '7px'
    }).transition().duration(50).style({
  'top' : '-7px',
      'left' : '-7px'
    });
    //Create explosion circle at bullet coordinates
    var explosionCircle = svg.selectAll('.collisionCircle').data([1]).enter()
      .append('circle').attr('class', '.collisionCircle')
      .attr('cx', d.x).attr('cy', d.y)
      .attr('r', settings.cannonR).attr('fill', 'red');

    explosionCircle.transition().duration(350)
      .style('opacity', 0).attr('r', 75).attr('fill', 'orange').remove();
}




