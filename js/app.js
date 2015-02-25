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
    expand: Em.Object.create({a: true, b: false, c: false, d: false}),

    actions: {
        resize: function(key) {
            var e = this.get('expand');
            e.setProperties({a: false, b: false, c: false, d: false});
            e.set(key, true);
        }
    }
});

App.PlayerRoute = Em.Route.extend({
    model: function() {
        if(!Ex.maps.global) { Ex.maps.global = Ex.HexMap.create(); }
        return Ex.maps.global;
    }
});
App.PlayerController = Em.ObjectController.extend({
    delay: 80,
    paused: false,
    stopped: true,
    pauseContext: null,

    gameCycle: function(teams) {
        //Test if game should keep running
        if(teams[0].get('tiles').length == 0) {
            alert('Team ' + team[1] + ' won!');
            this.set('stopped', true);
        }
        else if(teams[1].get('tiles').length == 0) {
            alert('Team ' + team[0] + ' won!');
            this.set('stopped', true);
        }

        if(this.get('stopped')) { return this.send('stopGame'); }
        else if(this.get('paused')) { return this.set('pauseContext', teams); }
            
        //Validate turn context and execute
        try { Ex.executeAction(teams); }
        catch(e) { 
            alert('An error was enconutered during this turn. ' + e + '; the game has been terminated.');
            return this.send('stopGame');
        }

        //Prepare for next turn 
        teams.getTeam().nextTile();
        teams.nextTeam();
        Em.run.later(this, this.get('gameCycle'), teams, this.get('delay')); 
    },


    actions:{
        startGame: function() {
            try { var f = eval('( function(team, index, position, move, attack, assimilate) { var console = null, document = null, alert = null; ' + Ex.editor.data + '} )'); }
            catch(e) { return alert('Your AI contains errors.  Please correct them and try again.'); }
            
            this.setProperties({
                paused: false,
                stopped: false
            });

            Em.run.later(this, this.get('gameCycle'),
                Ex.Team.create({name: 'Blue', script: f}),
                Ex.Team.create({name: 'Red',  script: Ex.AIScript}),
            this.get('delay') ); 
        },

        stopGame: function() {
            this.setProperties({
                stopped: true,
                paused: false
            });
        },

        pauseGame: function() {
            this.set('paused', true); 
        },

        unpauseGame: function() {
            this.set('paused', false); 
            this.get('playCycle')(this.get('pauseContext'));
        }
    }
});


App.AllRoute = Em.Route.extend({
    redirect: function() {
        this.transitionTo('edit');
    }
});
App.IndexRoute = App.AllRoute;
