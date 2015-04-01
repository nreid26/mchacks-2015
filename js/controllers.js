App.EditorController = Em.Controller.extend({
    expand: Em.Object.create({
        objective: true,
        tiles: false,
        directions: false,
        api: false,

        last: 'objective'
    }),
    editor: null,

    save: function() {
        window.localStorage.setItem('program', this.get('model.data'));
    },
    syncEditor: function() {
        var e = this.get('editor'),
            m = this.get('model');

        if(e) {
            e.setTheme("ace/theme/monokai");
            e.getSession().setMode("ace/mode/javascript");
        }
        if(e && m) {
            e.setValue(m.get('data'));
            e.on('change', function() { m.set('data', e.getValue()); }); //Synchronize model with editor
        }
    }.observes('editor', 'model'),

    actions: {
        expand: function(key) {
            var e = this.get('expand');
            e.set(e.get('last'), false);
            e.set('last', key);
            e.set(key, true);
        },

        save: function() { this.save(); }
    },

    init: function() {
        this._super();

        var cont = this;
        window.addEventListener('beforeunload', function() { cont.get('save').call(cont); });
    }
});

App.PlayerController = Em.ObjectController.extend({
    delay: 1000,
    paused: false,
    stopped: true,
    teamGroup: null,

    gameCycle: function() {
        var teams = this.get('teamGroup'),
            winner = teams.get('winner'),
            ran = teams.get('active'),
            command = ran.get('command'),
            error = ran.get('error');

        //Test for game end/timeout
        if(winner) { this.stop(winner + ' won!'); }
        else if(!command) { this.stop(ran.get('name') + ' is taking too long; the game has been terminated.'); }
        else {
            try { Ex.executeAction(ran, command); } //Run the last command
            catch(e) { error = e; }
        }

        if(error) { this.stop('An error was enconutered during this turn; the game has been terminated.\n\n' + error); }
        
        if(this.get('stopped') || this.get('paused')) { return; }

        //Prepare for next turn 
        ran.set('command', null);
        teams.advance();
        teams.get('active').run(); //Trigger the next team
        Em.run.later(this, this.get('gameCycle'), this.get('delay')); 
    },

    play: function() {
        //Prepare map
        var map = this.get('model'),
            roots = map.prepare(2);

        console.log(Ex.editor.get('data')); //THE EDITOR DOESN'T ALWAYS HAVE DATA
            
        this.setProperties({
            stopped: false,
            paused: false,
            teamGroup: Ex.TeamGroup.create({
                hexMap: map,
                teams: [
                    Ex.Team.create({tiles: [roots[0]], name: 'Blue', color: Ex.tileColors.FRIENDLY, script: Ex.editor.get('data')}),
                    Ex.Team.create({tiles: [roots[1]], name: 'Red',  color: Ex.tileColors.HOSTILE,  script: Ex.AIScript})
                ]
            })
        });

        this.get('teamGroup.active').run(); //Run the first team
        Em.run.later(this, this.get('gameCycle'), this.get('delay'));
    },
    stop: function(message) { 
        this.setProperties({
            stopped: true,
            paused: false
        });
        this.get('teamGroup').terminate();
        if(message) { alert(message); }
    },
    pause: function() { this.set('paused', true); },
    unpause: function() { 
        this.set('paused', false);
        this.get('gameCycle').call(this);
    },
    
    actions:{
        toggleStopped: function() { this.get((this.get('stopped')) ? 'play' : 'stop').call(this); },

        togglePaused: function() { 
            if(this.get('stopped')) { return; }
            this.get((this.get('paused')) ? 'unpause' : 'pause').call(this);
        }
    }
});