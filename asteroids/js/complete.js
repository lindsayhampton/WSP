/*
 Lindsay Hampton
 September 17th 2015
 */

console.log("js loaded");

window.addEventListener("load",function(e){
    var game = new Game();
});

var Game = (function(){
    function Game(){
        console.log("game created");
        this.screen = document.querySelector("#canvas");
        this.player = null;
        this.rocks = [];
        this.images = [];
        this.score = 0;
        Game.sndShoot=new Audio("sounds/asteroids_shoot.wav");
        Game.death=new Audio("sounds/explode1.wav");

        Game.ctx = this.screen.getContext("2d");
        this.scoreTxt = document.querySelector("#score");
        this.loadAssets(["player.png","rock1.png","sf1.jpg"]);
    }


    Game.prototype.init = function(){
        Key.init(window);
        Bullet.initAll();
        this.screen.style.background = "url("+this.images[2].src+")";
        this.player = new Player(this.images[0]);
        this.player.x = 400;
        this.player.y = 300;
        this.player.setScale(.9);
        this.createRocks(5,.7,100,Math.random()*400+100);
        Bullet.hitList = this.rocks;
        this.updateAll();
    };
    Game.prototype.createRocks = function(n,s,x,y){
        for (var i = 0;i<n;i++){
            var rock = new Rock(this.images[1]);
            rock.x=x;
            rock.y=y;
            rock.setScale(s);
            rock.ele.addEventListener("rockhit",this.rockHit.bind(this));
            this.rocks.push(rock);
        }
    };
    Game.prototype.rockHit = function(e){
        Game.death.cloneNode(true).play();
        this.score += e.obj.points;
        this.scoreTxt.innerHTML ="SCORE:"+this.score;
        if (e.obj.scale>.3){
            this.createRocks(2, e.obj.scale *.5, e.obj.x, e.obj.y);
        }
    };
    Game.prototype.updateAll = function(){
        var that = this;
        (function drawFrame(){
            window.requestAnimationFrame(drawFrame);
            Game.ctx.clearRect(0, 0, that.screen.width, that.screen.height);
            that.player.update();
            that.rocks.forEach(function(e){
                if(e.alive){
                    e.update();
                    if (that.getDistance(e)<40+e.width *.5){
                        that.player.state = "dead";
                    }
                }
                });
            Bullet.updateAll();
        })();
    };
    Game.prototype.getDistance = function(obj){
        var dx = this.player.x - obj.x;
        var dy = this.player.y - obj.y;
        var distance = Math.sqrt(dx*dx+dy*dy);
        return distance;
    };
    Game.prototype.loadAssets = function(list) {
        var count = 0;
        var that = this;
        (function loadAsset() {
            console.log("loading assets");
            var img = new Image();
            img.src = "imgs/" + list[count];
            img.addEventListener("load", function (e) {
                that.images.push(img);
                count++;
                if (count<list.length){
                    loadAsset();
                }
                else{
                    that.init();
                }
            })
        })()
    };
    return Game;
})();

var Sprite = (function(){
    function Sprite(img){
        this.x=0;
        this.y=0;
        this.scale = 1;
        this.width = img.width;
        this.height = img.height;
        this.ctx = Game.ctx;
        this.ele = document.createElement("null");
        if (img!=false){
            this.image = img;
        }
        this.rotate = 0;
        console.log("sprite created");
    }
    Sprite.prototype.setScale = function(value){
        this.scale = value;
        this.width = this.image.width*this.scale;
        this.height = this.image.height*this.scale;
    };
    Sprite.prototype.stageWrap = function(){
        if (this.x>800+this.width*.5){

            this.x = -this.width*.5
        }
        else if (this.x<-this.width*.5){

            this.x = 800+this.width*.5
        }
        else if (this.y>600+this.height*.5){

            this.y = -this.height*.5
        }
        else if (this.y<-this.height*.5){

            this.y = 600+this.height*.5
        }
    };
    Sprite.prototype.draw  = function(){
        this.ctx.save();
        this.rotate = this.rotate%360;
        var rad = this.rotate * .01745;
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(rad);
        this.ctx.scale(this.scale,this.scale);
        if (this.image!=undefined) this.ctx.drawImage(this.image, -(this.image.width *.5), -(this.image.height *.5));
        this.ctx.restore();
    };
    Sprite.prototype.drawBullet = function(){
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = 'limegreen';
        this.ctx.fill();
        this.ctx.restore();
    };
    return Sprite
})();

var Player = (function(){
    Player.prototype = Object.create(Sprite.prototype);
    function Player(img){
        console.log("player created");
        Sprite.call(this,img);
        this.speedX = 0;
        this.speedY = 0;
        this.shotClock = 0;
        this.state = "normal";
    }
    Player.prototype.update = function(){
        if (this.state=="dead"){
            this.scale-=.02;
            if (this.scale<=0)this.scale=0;
            this.rotate+=10;
            this.draw();
            return
        }
        if (Key.keys[37]){
            this.rotate-=5;
        }
        if (Key.keys[39]){
            this.rotate+=5;
        }
        if (Key.keys[38]) {
            var a = this.rotate * .0175;
            this.speedX += Math.cos(a)*.4;
            this.speedY += Math.sin(a)*.4;
            var m = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
            if (m > 5) {
                this.speedX = this.speedX / m * 5;
                this.speedY = this.speedY / m * 5;
            }
        }
        if (Key.keys[16] && this.shotClock <1){
            Game.sndShoot.cloneNode(true).play();
            var aa = this.rotate*.0175;
            var vx = Math.cos(aa);
            var vy = Math.sin(aa);
            var b = Bullet.make(1,vx,vy,this.speedX,this.speedY);
            b.x = this.x+vx*35;
            b.y = this.y+vy*35;
            this.shotClock=8;
        }
        this.x+=this.speedX;
        this.y+=this.speedY;
        this.stageWrap();
        this.shotClock--;
        this.draw();
    };
    return Player;
})();

var Bullet = (function(){
    Bullet.prototype = Object.create(Sprite.prototype);
    Bullet.bulletList = [];
    Bullet.hitList = [];
    Bullet.index = 0;

    Bullet.initAll = function(){
        Bullet.bulletList = [];
        for (var i = 0 ; i < 100 ; i++)
        {
            var b = new Bullet();
            Bullet.bulletList.push(b);
        }
    };

    Bullet.make = function(type,vx,vy,ox,oy){
        if(Bullet.index>99){
            Bullet.index=0;
        }
        var b = Bullet.bulletList[Bullet.index];
        b.vx = vx;
        b.vy = vy;
        b.alive = true;
        b.damage = 15;
        b.offsetX = ox;
        b.offsetY = oy;
        Bullet.index++;
        return b;
    };

    Bullet.updateAll = function() {
        Bullet.bulletList.forEach(function (e) {
            if (e.alive) {
                e.update();
            }
        })
    };
    function Bullet(){
        Sprite.call(this,false);
        this.vx=0;
        this.vy=0;
        this.alive=false;
        this.speed=15;
        this.damage = 5;
    }
    Bullet.prototype.checkHit = function(){
        Bullet.hitList.forEach(function(e) {
            var ofx = e.x - e.width*.5;
            var ofy = e.y - e.height*.5;
            if (e.alive && this.alive && (this.x >= ofx && this.x <= ofx + e.width && this.y >= ofy && this.y <= ofy + e.height)) {
                console.log("hit");
                this.alive = false;
                e.hit();
            }
        }.bind(this))
    };
    Bullet.prototype.update = function(){
        this.x+=this.vx*this.speed+this.offsetX*.5;
        this.y+=this.vy*this.speed+this.offsetY*.5;
        this.checkHit();
        this.drawBullet();
    };
    return Bullet;
})();

var Rock = (function(){
    Rock.prototype = Object.create(Sprite.prototype);
    function Rock(img){
        Sprite.call(this,img);
        this.speed=~~(Math.random()*5+3);
        this.alive=true;
        var a = Math.random()*6.28;
        this.vx = Math.cos(a);
        this.vy = Math.sin(a);
        this.points = 25;
    }
    Rock.prototype.hit = function(){
        this.alive = false;
        var evt = new Event("rockhit");
        evt.obj = this;
        this.ele.dispatchEvent(evt);
    };
    Rock.prototype.update = function() {
        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;
        this.rotate += 5;
        this.stageWrap();
        this.draw();
    };
    return Rock;
})();

var Key = (function(){
    function Key(){
    }
    Key.init = function(s){
        console.log("keys init");
        Key.keys = [];
        window.addEventListener("keydown",Key.onKeyDown);
        window.addEventListener("keyup",Key.onKeyUp);
    };
    Key.onKeyDown = function(e){
        Key.keys[e.keyCode]=1;
    };
    Key.onKeyUp = function(e){
        Key.keys[e.keyCode]=0;
    };
    return Key;
})();