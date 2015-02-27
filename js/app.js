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
        if(!Ex.map) { 
            Ex.map = Ex.HexMap.create();
            Ex.map.prepare();
        }
        return Ex.map;
    }
});
App.PlayerController = Em.ObjectController.extend({
    delay: 80,
    paused: false,
    stopped: true,
    pauseContext: null,
    teams: null,

    gameCycle: function(teams) {
        //Test if game should keep running
        var fil = teams.filter( function(team) { return team.get('list.length') > 0; } );
        if(fil.length == 1) {
            alert(fil[0].get('name') + ' won!');
            this.set('stopped', true);
        }

        if(this.get('stopped')) { return this.send('stopGame'); }
        else if(this.get('paused')) { return this.set('pauseContext', teams); }
            
        //Validate turn context and execute
        try { Ex.executeAction(teams); }
        catch(e) { 
            alert('An error was enconutered during this turn; the game has been terminated.\n\n' + e);
            return this.send('stopGame');
        }

        //Prepare for next turn 
        teams.get('active').advance();
        teams.advance();
        Em.run.later(this, this.get('gameCycle'), teams, this.get('delay')); 
    },

    actions:{
        startGame: function() {
            try { var f = eval('( function(team, index, position, surroundings, move, attack, assimilate) { var window = null, document = null, alert = null; ' + Ex.editor.data + '} )'); }
            catch(e) { return alert('Your AI contains errors.  Please correct them and try again.'); }
            
            this.setProperties({
                paused: false,
                stopped: false
            });

            var map = this.get('model'),
                roots = map.prepare(2),
                group = Ex.TeamGroup.create({
                    hexMap: map,
                    list: [
                        Ex.Team.create({first: roots[0], name: 'Blue', type: Ex.tileTypes.FRIENDLY, script: f}),
                        Ex.Team.create({first: roots[1], name: 'Red',  type: Ex.tileTypes.HOSTILE,  script: Ex.AIScript})
                    ]
                });
            
            this.set('teams', group);
            Em.run.later(this, this.get('gameCycle'), group, this.get('delay')); 
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
            this.get('gameCycle').call(this, this.get('pauseContext'));
        }
    }
});

App.ScoreboxView = Em.View.extend({
    tagName: 'div',
    classNameBindings: ['team.type'],

    team: null,
    map: null,

    adjustHeight: function() {
        Em.run.scheduleOnce('afterRender', this, function() {
            var size = this.get('team.size');
            if(size > 0) {
                this.$().animate({height: (size / this.get('map.tileCount') * 100) + '%'}, 200);
            }
            else { 
                this.$().css({height: 0});
            }
        });
    }.observes('team.size', 'map.tileCount').on('init')
});


App.AllRoute = Em.Route.extend({
    redirect: function() {
        this.transitionTo('edit');
    }
});
App.IndexRoute = App.AllRoute;