function TXListener(socket, provider, transaction) {

    this.socket = socket;
    this.provider = provider;
    this.transaction = transaction;

    this.blockheight = null;
    this.confirmations = null;

}

TXListener.prototype.initSocket = function(cb) {
    var self = this;
    var socket = this.socket;

    socket.on('block', function(data) {
        console.log('block: '+ data);

        self.getBlock(data, function(err, res) {

            if (err) console.log("error fetching block: " + data);
            self.confirmations = (res.height - self.blockheight) + 1; // compare blockHeight against transaction blockHeight
            var confirmation_count = (res.height - self.confirmations) + 1;
            console.log("res: ", res);
            console.log("self: ", self);
            console.log(confirmation_count);

            if (confirmation_count >= 6) {
              cb();
            };
            $("#progressbar").progressbar({value: ((100 / 6) * self.confirmations)});

            console.log('confirmations: ' + self.confirmations);

        });
    });

};

TXListener.prototype.getTx = function(cb) {
    var txid = this.transaction;

    var opts = {
        type: "GET",
        route: "insight-api-dash/tx/"+txid,
        data: {
            format: "json"
        }
    };
    console.log(opts);

    this._fetch(opts, cb);
};

TXListener.prototype.getBlock = function(hash, cb) {

    var opts = {
        type: "GET",
        route: "insight-api-dash/block/"+hash,
        data: {
            format: "json"
        }
    };

    this._fetch(opts, cb);
};

TXListener.prototype._fetch = function(opts,cb) {
    var self = this;
    var provider = opts.provider || self.provider;

    if(opts.type && opts.route && opts.data) {

        jQuery.ajax({
            type: opts.type,
            url: provider + opts.route,
            data: JSON.stringify(opts.data),
            contentType: "application/json; charset=utf-8",
            crossDomain: true,
            dataType: "json",
            success: function (data, status, jqXHR) {
                cb(null, data);
            },
            error: function (jqXHR, status, error) {
                var err = eval("(" + jqXHR.responseText + ")");
                cb(err, null);
            }
        });

    } else {
        cb('missing parameter',null);
    }
};
