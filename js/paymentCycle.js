/***
 * Payment Cycle Generator
 *
 * @param gov
 * @constructor
 */
function PaymentCycle(gov) {
    var self = this;

    this.network = gov.network;
    this.paymentCycle = 16616; // mainnet
    this.budgetCycles = 24;

    if (this.network == 'testnet') this.paymentCycle = 24;
    if (this.network == 'testnet') this.budgetCycles = 96;

    this.blockHeight = null;

    this.Messages = {
        paymentCycle: {
            months: "Months",
            month: "Month",
            days: "Days",
            day: "Day",
            hours: "Hours",
            hour: "Hour",
            minutes: "Minutes",
            minute: "Minute",
            seconds: "Seconds",
            second: "Second"
        }
    };

    this.getInfo(function(err,res) {
        console.log("current blockheight: " + res.info.blocks);

        self.blockHeight = res.info.blocks;
    });
}

PaymentCycle.prototype.getNextSuperblock = function(block) {
    return (Math.floor((block/this.paymentCycle)) * this.paymentCycle + this.paymentCycle);
};

PaymentCycle.prototype.getBlockTimestamp = function(block) {
    var blocks = block - this.blockHeight;
    var now = Math.floor(Date.now());

    return (now + (blocks * (155 * 1000))); // 155 seconds per block x 1000 = ms per block
};

PaymentCycle.prototype.getTimeDifference = function(opts, start, end) {

    var precision = opts.precision;

    var millisec = end - start;

    var seconds = (millisec / 1000).toFixed(precision);

    var minutes = (millisec / (1000 * 60)).toFixed(precision);

    var hours = (millisec / (1000 * 60 * 60)).toFixed(precision);

    var days = (millisec / (1000 * 60 * 60 * 24)).toFixed(precision);

    var months = (millisec / (1000 * 60 * 60 * 24 * 30)).toFixed(precision);

    if (seconds < 60) {
        if (seconds <= 1) return seconds + " " + this.Messages.paymentCycle.second; // singular
        return seconds + " " + this.Messages.paymentCycle.seconds;
    } else if (minutes < 60) {
        if (minutes <= 1) return minutes + " " + this.Messages.paymentCycle.minute; // singular
        return minutes + " " + this.Messages.paymentCycle.minutes;
    } else if (hours < 24) {
        if (hours <= 1) return hours + " " + this.Messages.paymentCycle.hour; // singular
        return hours + " " + this.Messages.paymentCycle.hours;
    } else if (days < 30) {
        if (days <= 1) return days + " " + this.Messages.paymentCycle.day; // singular
        return days + " " + this.Messages.paymentCycle.days;
    } else {
        if (months <= 1) return months + " " + this.Messages.paymentCycle.month; // singular
        return months + " " + this.Messages.paymentCycle.months;
    }
};

PaymentCycle.prototype.updateDropdowns = function() {
    var self = this;

    var blockHeight = this.blockHeight;

    var startDate = [];
    var endDate = [];

    for (i = 0; i < this.budgetCycles + 1; i++) {

        var superblock = this.getNextSuperblock(blockHeight);
        var timestamp = this.getBlockTimestamp(superblock);

        var label = new Date(timestamp).toLocaleDateString();
        if (this.network == 'testnet') label = new Date(timestamp).toLocaleString();

        var superblockDate = {
            superblock: superblock,
            timestamp: timestamp,
            label: label
        };
        startDate.push(superblockDate);
        endDate.push(superblockDate);

        blockHeight = superblock;

    }

    endDate.shift(); // remove first element of endDate
    startDate.pop(); // remove last element of startDate to keep length even

    var now = Math.floor(Date.now());

    var opts = {
        precision: 2
    }; // 2 unit of precision for eta formatting

    // calculate the amount of time between start and stop, show: e.g. 5 Months or 5 Hours

    var start_epoch = $("#start_epoch");
    start_epoch.find('option').remove();
    $.each(startDate, function(index) {

        var eta = self.getTimeDifference(opts, now, this.timestamp);
        var time = this.timestamp - now;
        var option = $("<option />").val((Math.floor(this.timestamp / 1000))).text(this.label).attr('data-index', index).attr('data-time', time).attr('data-eta', eta).attr('data-block', this.superblock);
        start_epoch.append(option);

    });


    opts.precision = null; // 0 units of precision for eta formatting

    var end_epoch = $("#end_epoch");
    end_epoch.find('option').remove();
    $.each(endDate, function(index) {

        var eta = self.getTimeDifference(opts, startDate[0].timestamp, this.timestamp);
        var time = this.timestamp - startDate[0].timestamp;

        var option = $("<option />").val((Math.floor(this.timestamp / 1000))).text(eta + " (" + this.label + ")").attr('data-index', index).attr('data-time', time).attr('data-eta', eta).attr('data-block', this.superblock);
        end_epoch.append(option);

    });


};

PaymentCycle.prototype.getInfo = function(cb) {
    $.getJSON(provider + "insight-api-dash/status?q=getinfo", function( data ) {
        cb(null, data);
    });
};
