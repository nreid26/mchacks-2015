App = Ember.Application.create();

App.Router.map(function() {
    this.route('editor');
    this.route('player');

    this.route('all', {path: '*path'});
});

Math.randInt = function(max, min) {
    if(!min) { min = 0; }
    return Math.floor(Math.random() * (max - min)) + min;
};