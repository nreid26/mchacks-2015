//Init team
if(!team.init) {
    team.init = true;
    
    team.map = {};
    team.roster = [];
    team.index = 0; //The player that should be going
    team.colors = {US: '', DEAD: '', EMPTY: ''};
    team.actions = Object.freeze({MOVE: 1, ATTACK: 2, ASSIMILAITE: 3, LOOK: 4, PASS: 5});
}

//Init player
if(!this.init) {
    this.init = true;
    
    team.roster.push(this);
    this.lastPos = position;
    this.lastDir = 0;

    this.clearDead = function (team) {
        var m = team.roster.indexOf(this),
            n = (team.index + 1) % team.roster;

        if(m > n) { team.roster.splice(n, m - n); }
        else if(m < n) { team.roster.splice(n, team.roster.length); }
        team.index = (team.index + 1) % team.roster;
     };

    this.mapRegion = function(team, position) {
        if(this.lastPos != position) {
            if(!team.map[this.lastPos]) { team.map[this.lastPos] = { state: '', self: this.lastPos, links: [null, null, null, null, null, null] }; }
            if(!team.map[position])     { team.map[position] =     { state: '', self: position,    links: [null, null, null, null, null, null] }; }
        
            team.map[this.lastPos].links[this.lastDir] = team.map[position];
            team.map[position].links[(this.lastDir + 3) % 6] = team.map[this.lastPos];

            team.map[this.lastPos].state = '';
            team.map[position].state = team.colors.US;

            this.lastPos = position;
        }
    };
}

this.clearDead(team);
this.mapRegion(team, position);
