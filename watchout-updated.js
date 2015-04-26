/*===================================
  Bomb Em
======================================*/

var init = function() {
  //Reset the game elements
  d3.selectAll('svg').remove();

  //Global game settings
  var settings = {
    height : 500,               //Height of game view
    width : 800,                //Width of game view
    enemyR: 7,                  //Radius of enemy circles
    cannonR : 25,               //Radius of player/cannon (the red circle at the bottom)
    bulletRX: 7,                //Bullet is ellipse, RX is width of bullet
    bulletRY: 14,               //Bullet is ellipse, RY is height of bullet
    numEnemies : 20,            //Number of enemies on screen
    enemyMovementSpeed: 1000,   //Time it takes enemies to move from their starting position to end in MS (lower is faster)
    timeBetweenMoves: 1000,     //Time between each time the enemies move to a new location in ms
    explosionR: 75,             //Radius of bullet explosion
    statsWidth: 250,            //Width of stats box at end of level
    statsHeight: 200            //Height of stats box at end of level
  }

  var Enemy = function(x, y) {
    this.x = x;
    this.y = y;
    this.color = "red";
    this.isDead = false;
  }

  var Cannon = function(x, y) {
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
  var populateEnemies = function() {
    var x;  //random x
    var y;  //enemies start off the screen then drop in

    for (var i = 0; i < settings.numEnemies; i++){
      //Find random x and y coord to spawn enemy off the screen
      x = 0 - (Math.floor(Math.random() * (settings.width * 2)));
      y = 0 - (Math.floor(Math.random() * (settings.height * 2)));
      //Randomize if number is positive or negative
      x *= (Math.round(Math.random()) * 2 - 1);
      y *= (Math.round(Math.random()) * 2 - 1);
      //Ff the enemy falls within the screen's bounds, convert it to negative value to be off screen
      if (x > 0 && x < settings.width){
        x *= -1;
      }
      if (y > 0 && y < settings.height){
        y *= -1;
      }
      //Spawn new enemy at random point
      var newEnemy = new Enemy(x, y);
      //Push new enemies into array in order to easily access their data in D3
      enemyArray.push(newEnemy);
    }

    //Paint all enemies on screen as SVG circles
    svg.selectAll('circle').data(enemyArray).enter()
        .append('circle')
        .attr('class', 'enemy alive')
        .attr("r", settings.enemyR + "px")
        .attr("cx", function(d, i){ return d.x; })
        .attr("cy", function(d, i){ return d.y; })
        .attr('fill', 'black');

    //Move enemies from their initial position off-board to a position within bounds to give
    //the effect of them zooming onto the screen
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

  //Create the cannon and paint to screen
  var populateCannon = function() {
    var cannon = new Cannon(settings.width / 2, settings.height);  //Create the cannon in the middle-botttom of screen
    cannonArray.push(cannon);  //Push the cannon into a global array to easily access with D3

    svg.selectAll('.player').data(cannonArray).enter()
      .append('circle')
      .attr('class', 'player')
      .attr("r", settings.cannonR)
      .attr("cx", function(d, i){ return d.x; })
      .attr("cy", function(d, i){ return d.y; })
      .attr('fill', function(d, i){ return d.color; });
  }

  //Create a bullet and paint to screen
  var fireBullet = function(targetX, targetY) {
    currentBullet = new Bullet(settings.playerX, settings.playerY);
    bulletArray.push(currentBullet);

    svg.selectAll('ellipse').data(bulletArray).enter()
        .append('ellipse')
        .attr('class', 'bullet')
        .attr("cx", function(d, i){ return cannonArray[0].x; })
        .attr("cy", function(d, i){ return cannonArray[0].y; })
        .attr("rx", function(d, i){ return settings.bulletRX; })
        .attr("ry", function(d, i){ return settings.bulletRY; })
        .attr('fill', 'black');
  }

  //Function called at an interval from main game loop
  //Moves all enemies to a new random position on the screen
  var moveEnemies = function() {
    //Transition all enemies to a new random location
    svg.selectAll('.enemy').filter('.alive').data(enemyArray)
       .transition().duration(settings.enemyMovementSpeed).ease('linear')
       .attr('cx', function(d, i){
          //Find random location and set property x for each enemy to check for collison detetction
          d.x = Math.floor(Math.random() * ((settings.width - settings.enemyR) - 50) + 50);
          return d.x;
        })
       .attr('cy', function(d, i){
          //Find random location and set property x for each enemy to check for collison detetction
           d.y = Math.floor(Math.random() * ((settings.height - 100) - 50) + 50);
          return d.y;
        })
       .tween('Set x & y properties', function(d, i){
          return function(t) {  //t is the percentage of the way through the transition
            //Set the properties x and y on each frame to check for collision detection
            d.x = d3.select(this).attr('cx');
            d.y = d3.select(this).attr('cy');
       }
    });
  }

  //Transitions bullet from cannon to end point and then explodes bullet and checks for collisions
  var moveBullet = function(targetX, targetY) {
    d3.select('body').selectAll('.bullet').data(bulletArray).transition().duration(300).ease('linear')
      .attr("cx", targetX)
      .attr("cy", targetY)
      .tween('Set x and y properties', function(d, i){
        return function(t){
          currentBullet.x = d3.select(this).attr('cx');
          currentBullet.y = d3.select(this).attr('cy');
        }
      })
      .remove().each('end', function(d, i){
          checkCollision();
          screenShake();
          animateExplosion(d);
          killEnemies();
          endLevel();
      });
  }

  var checkCollision = function() {
    var deadIndex = [];

    for (var i = 0; i < enemyArray.length; i++){
      //get distances between objects
      var dx = currentBullet.x - enemyArray[i].x;
      var dy = currentBullet.y - enemyArray[i].y;
      var distance = Math.sqrt(dx * dx + dy * dy);

      //check if the objects are close enough to be touching
      if (distance <= settings.explosionR + settings.enemyR){
        //set all enemies within range to dead
        enemyArray[i].isDead = true;
        deadArray.push(enemyArray[i]);
      }
    }
  }

  var killEnemies = function(){
    svg.selectAll('.enemy').data(enemyArray)
      .classed('alive', function(d){
        //if enemy is dead, give it class .dead
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

    //select all dead enemies and drop them to the floor
    svg.selectAll('circle').filter('.dead').data(deadArray)
      .transition().duration(750).ease('bounce')
      .attr('cy', function(d){
        d.y = settings.height - settings.enemyR;
        return d.y;
      });
  }

  var screenShake = function(d) {
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
  }

  var animateExplosion = function(d) {
    //Create explosion circle at bullet coordinates
    var explosionCircle = svg.selectAll('.collisionCircle').data([1]).enter()
      .append('circle').attr('class', '.collisionCircle')
      .attr('cx', d.x).attr('cy', d.y)
      .attr('r', settings.cannonR).attr('fill', 'red');

    explosionCircle.transition().duration(350)
      .style('opacity', 0).attr('r', settings.explosionR).attr('fill', 'orange').remove()
      .each('end', function(d){
        bulletArray.pop();
      });
  }

  var showScore = function() {
    // Write score on scoreboard
    $('.score').html(deadArray.length);
    // Set high score on scoreboard
    var $highScore = $('.high-score');
    if($highScore.html() < deadArray.length){
      $highScore.html(deadArray.length);
    }
  }

  var endLevel = function() {
    //tally how many enemies were killed using deadArray.length
    //show score/stats
    //give option to replay
    console.log("Enemies killed: ", deadArray.length);

    showScore();

    // Click to restart the game after bullet is fired
    d3.select('.gameSpace').on('click', function(d){
      //restart game
     $('.score').html(0);
      init();
    });

    // Show a final score box on a delat after a shot is fired to display stats
    // setTimeout(function(){
    //   svg.selectAll('.stats').data([1]).enter()
    //     .append('rect').attr('class', '.stats')
    //     .attr('x', '300')
    //     .attr('y', '150')
    //     .attr('width', settings.statsWidth)
    //     .attr('height', settings.statsHeight)
    //     .attr('fill', 'red')
    //     .attr('opacity', 0)
    //     .transition().duration(2500)
    //     .attr('opacity', 100);
    // }, 1000);
  }

  //----GLOBAL VARIABLES----
  //Create the initial svg element that will be the game board
  d3.select('.gameSpace').append("svg");
  var svg = d3.select('svg').attr("height", settings.height).attr("width", settings.width);
  var gameScreen = d3.select('.gameSpace').style("height", settings.height + "px").style("width", settings.width + "px");

  var enemyArray = [];    //Array that stores all enemies on game screen
  var cannonArray = [];   //d3 accepts arrays as data arguments so push the player object into an array even though there is only one of them
  var bulletArray = [];   //Array to store the bullet for esasy manipulation with d3
  var deadArray = [];     //Push enemies that are dead into an array
  var currentBullet;      //The bullet that has been fired

  //----MAIN GAME FUNCTION----
  var startGame = function() {

    populateEnemies(settings.numEnemies); //Draw enemies on screen
    populateCannon();                     //Create the player and paint to screen

    var mouseCoordinates = [0, 0];        //d3 coordinates are stored in an array, [x, y]
    var canShoot = true;                  //State of whether cannon can be fired

    //Move enemies every settings.timeBetweenMoves milliseconds
    setInterval(function(){ moveEnemies(); }, settings.timeBetweenMoves);

    //Fire bullet when user clicks
    d3.select('.gameSpace').on('click', function(d){
      var mouseCoordinates = d3.mouse(this);
      mouseX = mouseCoordinates[0];
      mouseY = mouseCoordinates[1];
      //shoot bullet in direction of mouse
      if (canShoot === true){
        fireBullet(mouseX, mouseY);
        moveBullet(mouseX, mouseY);
        canShoot = false;
      }
    });
  }

  startGame();
}

init();
