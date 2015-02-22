App = Ember.Application.create();

App.Router.map(function() {
    this.route('editor');
    this.route('player');

    this.route('all', {path: '*path'});
});


App.EditorRoute = Em.Route.extend({});
App.EditorView = Em.View.extend({
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
App.EditorController = Em.Controller.extend({
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
        //set up game
        //alert(model);
        //new ones for e
        console.log(model.map);
        controller.set('model',model);

        
    }
});
App.PlayerController = Em.ObjectController.extend({
    actions:{startGame:function(){
        //start game
    },endGame:function(){
        //end the game
    },pauseGame:function(){
        //pause the game
    },unpauseGame:function(){
        //unpause the game
    },swichView:function(view){
        //reset model
    }}
})


App.AllRoute = Em.Route.extend({
    redirect: function() {
        this.transitionTo('editor');
    }
});
App.IndexRoute = App.AllRoute;
