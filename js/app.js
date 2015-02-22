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
    }
});

App.PlayerRoute = Em.Route.extend({
    model: function() {
        if(!Ex.maps.global) {
            Ex.maps.global = Ex.HexMap.create();
            Ex.maps.yours = Ex.HexMapMirror.create({base: Ex.maps.global});
            Ex.maps.mine = Ex.HexMapMirror.create({base: Ex.maps.global});
        }
        return Ex.maps.global;
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
            /*$(window).resize(function(){
                console.log('test');
                $('#game').css('-webkit-transform','scale('+$(window).height()/$('#game').height()+','+$(window).height()/$('#game').height()+')');
                $('#game').css('transform','scale('+$(window).height()/$('#game').height()+','+$(window).height()/$('#game').height()+')')
            });*/
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
});
App.PlayerController = Em.ObjectController.extend({
    yours: [Ex.Player.createYours()],
    mine: [Ex.Player.createMine()],
    delay: 2000,
    paused: false,
    stopped: true,

    pauseContext: null,


    gameCycle: function( a, teamA, scriptA, b, teamB, scriptB) {
        //Test if game should keep running
        if(this.get('stopped')) { return; }
        else if(this.get('paused')) { 
            return this.set('pauseContext', [this, a, teamA, scriptA, b, teamB, scriptB]);
        }
            
        //Validate turn context and execute
        a = (a < teamA.length) ? a : 0;
        try { 
            var command = scriptA.call(teamA[a], a, teamA.length);
            Ex.executeCommand(command,a,teamA);
        }
        catch(e) { 
            alert('An error was enconutered during this turn. The game has been terminated');
            this.get('actions.stopGame')();
        }

        //Prepare for next turn 
        Em.run.later(this,this.get('gameCycle'), b, teamB, scriptB, ++a, teamA, scriptA, this.get('delay')); 
    },


    actions:{
        startGame: function() {
            try { var f = eval('( function(index, teamSize) { var window = null, document = null; ' + Ex.editor.data + '} )'); }
            catch(e) { return alert('Your AI contains errors.  Please correct them and try again.'); }

            var w = model.get('width');
            var h = model.get('height');
            model.cellAt(5,3).set('state',2); //add player 1
            model.cellAt(5,7).set('state',3); //add player 2
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
            
            this.setProperties({
                paused: false,
                stopped: false
            });
            var that = this;
            Em.run.later(this,this.get('gameCycle'), 0, this.get('mine'), f, 0, this.get('yours'), Ex.aiScript,this.get('delay')
            ); 
        },

        stopGame: function() {
            this.setProperties({
                yours: [Ex.Player.createYours()],
                mine: [Ex.Player.createMine()],
                stopped: true,
                paused: false
            });
        },

        pauseGame: function() {
            this.set('paused', true); 
        },

        unpauseGame: function() {
            var args = this.get('pauseContext');
            this.get('playCycle')(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        },

        switchView: function(view) {
            var model = this.get('model'), models = [Ex.maps.global, Ex.maps.ai, Ex.maps.player];
            for(var i = 0; models[i] != model; i++) { }
            this.set('model', models[(i + 1) % 3]);
        }
    }
})


App.AllRoute = Em.Route.extend({
    redirect: function() {
        this.transitionTo('editor');
    }
});
App.IndexRoute = App.AllRoute;
