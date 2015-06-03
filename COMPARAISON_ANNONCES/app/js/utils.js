var SelogerUI = SelogerUI || {};

Array.prototype.totalForProperty = function(prop){
    var total = 0;
    for (var i = 0, len = this.length; i < len; i++) {
        total += this[i][prop];
    }
    return total;
};
