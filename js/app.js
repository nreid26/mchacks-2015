App = Ember.Application.create();

App.Router.map(function() {
    this.route('edit', {path: '/editor'});
    this.route('player');

    this.route('all', {path: '*path'});
});


App.EditRoute = Em.Route.extend({});
App.EditView = Em.View.extend({
    didInsertElement: function() {
        var view = this;
        Em.run.schedule('afterRender', function() {
            var v = ace.edit("editor"); 
            v.setTheme("ace/theme/monokai");
            v.getSession().setMode("ace/mode/javascript");
            v.setValue(Ex.editor.get('data'));
            v.on('change', function() {
                Ex.editor.set('data',v.getValue());
            });
        });
    }
});
App.EditController = Em.Controller.extend({
    actions: {
        presentEditor: function() {
            var code = Ex.editor.getValue();
            alert(code);
        }
    }
});

App.PlayerRoute = Em.Route.extend({
    model:function(){
        Ex.maps.global = Ex.HexMap.create({defaultState:0});
        Ex.maps.ai = Ex.HexMap.create({defaultState:5});
        Ex.maps.player = Ex.HexMap.create({defaultState:5});
        return Ex.maps.global;
    },
    setupController:function(controller, model){
        var w = model.get('width');
        var h = model.get('height');
        console.log(w);
        console.log(h);
        //add player 1
        model.cellAt(5,3).set('state',2);
        //add player 2
        model.cellAt(5,7).set('state',3);
        //percentage of the map that's dead
        var numOthers = Math.round(w*h*0.15);
        for(var i=0; i<numOthers;i++){
            var x = Math.floor(Math.random()*(w-1));
            var y = Math.floor(Math.random()*(h-1));
            //check that cell is ok
            if(model.cellAt(x,y).state == 0){
                model.cellAt(x,y).set('state',1);
            } else {
                i--;
            }
        }
        controller.set('model',model);
    }
});
App.PlayerView = Em.View.extend({
    didInsertElement:function(){
        var view = this;
        Em.run.schedule('afterRender', function() {
            var v = document.getElementById('game');
            var mousePos = {};
            var mouseDown = false;
            var rotation = {x:0,y:0};
            $(v).on('mousedown', function(event) {
                mousePos.x = event.pageX;
                mousePos.y = event.pageY;
                mouseDown = true;
            });
            $(v).on('mousemove',function(evt){
                if(mouseDown){
                    var dx = event.pageX-mousePos.x;
                    var dy = mousePos.y - event.pageY;
                    mousePos.x = event.pageX;
                    mousePos.y = event.pageY;
                    rotation.x += dx;
                    rotation.y += dy;
                    var change = 'perspective(1600px) rotateX('+rotation.y/10+'deg) rotateY('+rotation.x/10+'deg)';
                    $(v).css('transform',change);
                    $(v).css('-webkit-transform',change);
                }
            });
            $(v).on('mouseup',function(evt){
                if('mouseDown'){
                    var dx = event.pageX-mousePos.x;
                    var dy = mousePos.y - event.pageY;
                    mousePos.x = event.pageX;
                    mousePos.y = event.pageY;
                    rotation.x += dx;
                    rotation.y += dy;
                    var change = 'perspective(1600px) rotateX('+rotation.y/10+'deg) rotateY('+rotation.x/10+'deg)';
                    $(v).css('transform',change);
                    $(v).css('-webkit-transform',change);
                    mouseDown = false;
                }
            });
        });
    }
})
App.PlayerController = Em.ObjectController.extend({
    yours: null,
    mine: null,
    delay: 2000,
    paused: false,
    stopped: true,

    pauseContext: null,


    gameCycle: function(controller, a, teamA, scriptA, b, teamB, scriptB) {
        //Test if game should keep running
        if(controller.get('stopped')) { return; }
        else if(controller.get('paused')) { 
            return controller.set('pauseContext', [controller, a, teamA, scriptA, b, teamB, scriptB]);
        }
            
        //Validate turn context and execute
        a = (a < teamA.length) ? a : teamA.length;
        try { var command = scriptA.call(teamA[a], a, teamA.length); }
        catch(e) { 
            controller.get('actions.stopGame')();
            alert('An error was enconutered during this turn. The game has been terminated');
        }
        //Do command... need API

        //Prepare for next turn 
        setTimeout(controller.get('gameCycle'), controller.get('delay'), b, teamB, scriptB, a++, teamA, scriptA); 
    },
    executeCommand: function(command) { },


    actions:{
        startGame: function() {
            try { var f = eval('return function(index, teamSize) { var window = null, document = null' + Ex.editor.data + '};'); }
            catch(e) { return alert('Your AI contains errors.  Please correct them and try again'); }
            
            this.setProperties({
                paused: false,
                stopped: false
            });

            setTimeout(this.get('gameCycle'), this.get('delay'),
                this, 0, this.get('players'), f, 0, this.get('ais')
            ); 
        },

        stopGame:function() {
            this.setProperties({
                ais: [Ex.Player.createYours()],
                players: [Ex.Player.createMine()],
                stopped: true,
                paused: false
            });
        },

        pauseGame:function() {
            this.set('paused', true); 
        },

        unpauseGame:function() {
        //unpause the game
        },

        swichView:function(view) {
        //reset model
        }
    }
})


App.AllRoute = Em.Route.extend({
    redirect: function() {
        this.transitionTo('editor');
    }
});
App.IndexRoute = App.AllRoute;
