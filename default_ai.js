function randInt(a) { return Math.floor(Math.random() * a); }

if(!this.init) {
    this.init = true;
    this.dir = 0;
    this.tasks = [move, attack, assimilate];
}

this.dir = (this.dir + 1) % 6;
return this.tasks[randInt(3)](this.dir);
