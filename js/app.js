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
            var v = $('#game');
            var mousePos = {};
            var mouseDown = false;
            var rotation = {x:0,y:0};

            v.on('mousedown', function(event) {
                mousePos.x = event.pageX;
                mousePos.y = event.pageY;
                mouseDown = true;
            });
            v.on('mousemove',function(evt){
                if(mouseDown){
                    var dx = event.pageX-mousePos.x;
                    var dy = mousePos.y - event.pageY;
                    mousePos.x = event.pageX;
                    mousePos.y = event.pageY;
                    rotation.x += dx;
                    rotation.y += dy;
                    var change = 'perspective(1600px) rotateX('+rotation.y/10+'deg) rotateY('+rotation.x/10+'deg)';
                    v.css('transform',change);
                    v.css('-webkit-transform',change);
                }
            });
            v.on('mouseup',function(evt){
                if('mouseDown'){
                    var dx = event.pageX-mousePos.x;
                    var dy = mousePos.y - event.pageY;
                    mousePos.x = event.pageX;
                    mousePos.y = event.pageY;
                    rotation.x += dx;
                    rotation.y += dy;
                    var change = 'perspective(1600px) rotateX('+rotation.y/10+'deg) rotateY('+rotation.x/10+'deg)';
                    v.css('transform',change);
                    v.css('-webkit-transform',change);
                    mouseDown = false;
                }
            });
        });
    }
});
App.PlayerController = Em.ObjectController.extend({
    yours: [Ex.Player.createYours()],
    mine: [Ex.Player.createMine()],
    delay: 200,
    paused: false,
    stopped: true,
    pauseContext: null,

    gameCycle: function(teamA, teamB) {
        //Test if game should keep running
        debugger;
        if(teamA.players.length == 0) { return alert('Team ' + teamB.name + ' won!'); }
        else if(teamB.players.length == 0) { return alert('Team ' + teamA.name + ' won!'); }
        else if(this.get('stopped')) { return; }

        if(this.get('paused')) { return this.set('pauseContext', [teamA, teamB]); }
            
        //Validate turn context and execute
        teamA.index = (teamA.index < teamA.players.length) ? teamA.index : 0;
        try { 
            var command = teamA.script.call(teamA.players[teamA.index], teamA.index, teamA.players.length);
            Ex.executeCommand(command, teamA);
        }
        catch(e) { 
            alert('An error was enconutered during this turn. The game has been terminated');
            this.get('actions').stopGame();
        }

        //Prepare for next turn 
        teamA.index++;
        Em.run.later(this, this.get('gameCycle'), teamB, teamA, this.get('delay')); 
    },


    actions:{
        startGame: function() {
            try { var f = eval('( function(index, teamSize) { var window = null, document = null; ' + Ex.editor.data + '} )'); }
            catch(e) { return alert('Your AI contains errors.  Please correct them and try again.'); }

            var model = Ex.maps.global;
            model.prepare();
            this.set('model', model);
            
            this.setProperties({
                yours: [Ex.Player.createYours()],
                mine: [Ex.Player.createMine()],
                paused: false,
                stopped: false
            });

            Em.run.later( this, this.get('gameCycle'),
                {index: 0, players: this.get('mine'), script: f, name: 'Mine'}, 
                {index: 0, players: this.get('yours'), script: Ex.AIScript, name: 'Yours'},
            this.get('delay') ); 
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
            this.set('paused', false); 
            var args = this.get('pauseContext');
            this.get('playCycle')(args[0], args[1]);
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
        this.transitionTo('edit');
    }
});
App.IndexRoute = App.AllRoute;
