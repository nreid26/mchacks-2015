App.EditorRoute = Em.Route.extend({
    model: function() {
        if(Ex.editor.data) { return Ex.editor; }
        
        var stored = window.localStorage.getItem('program');
        if(stored) {
            Ex.editor.data = stored;
            return Ex.editor;
        }

        return new Em.RSVP.Promise(function(resolve, reject) {
            $.ajax({
                type: 'GET',
                url: '/default_ai.js',
                dataType: 'text'
            })
            .then(
                function(data) {
                    Ex.editor.data = data;
                    resolve(Ex.editor);
                },
                function(error) {
                    Ex.editor.data = '';
                    resolve(Ex.editor);
                }
            );
        });
    },

    actions: {
        willTransition: function() { //Save when leaving editor
            this.get('controller').send('save');
            return true;
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
    },

    actions: {
        willTransition: function() { //Pause game when leaving running player
            var controller = this.get('controller');
            if(!controller.get('stopped')) { controller.pause(); }
            return true;
        }
    }
});

App.AllRoute = Em.Route.extend({
    redirect: function() {
        this.transitionTo('edit');
    }
});
App.IndexRoute = App.AllRoute;