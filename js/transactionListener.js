function transactionListener(proposal) {

    $('#feeTxid').on('input', function() {

	$('.walletCommands#walletCommandsSubmit').removeClass('hidden');

        if ($(this).val().length > 0) {

            var submitCommand = "gobject submit " + $('#parentHash').val() + " " + $('#revision').val() + " " + $('#time').val() + " " + proposal.gov.serialize() + " " + $(this).val();
            console.log(submitCommand);

            var txidfield = $('#feeTxid');
            console.log('value entered: ' + txidfield.val());

            $('textarea#submitProposal').val(submitCommand);

            txidfield.change(function() {
                // Check input( $( this ).val() ) for validity here
                console.log('there is something wrong with your transaction ID: ' + $('#feeTxid').val() + ' Please copy and paste it here .');
                txidfield.val('')
            });

            //some checks if feeTxid seems valid before we check the api
            if (txidfield.val().length == 64) {
                if (isAlphaNumeric(txidfield.val())) {
                    txidfield.unbind( "change" );
                    console.log('feeTxid seems good: ' + txidfield.val());
                    console.log("wait while we check the api!");

                    // first check if transactionid is already in api
                    $.getJSON(provider + 'insight-api-dash/tx/' + txidfield.val(), function(data) {
                        txidfield.attr("disabled", true);
                        $('.walletCommands#walletCommandsProgress').removeClass('hidden');

                        document.getElementById('step_three').click();
                        document.getElementsByClassName('progress-bar')[0].style.width = "75%";
                        document.getElementsByClassName('progress-bar')[0].innerText = "Awaiting network confirmations...";

                        var txid = data.tx;
                        var confirmations = data.confirmations;
                        var conftxt;
                        var conftxt2;
                        var progbarval;
                        console.log('Transaction has ' + confirmations + ' confirmation(s)');
                        progbarval = 100/6*confirmations;
                        $("#progressbar").progressbar({value: progbarval})
                            .children('.ui-progressbar-value')
                            .html(progbarval.toPrecision(3) + '%')
                            .css("display", "block");
                        if (confirmations != 'undefined' && $.isNumeric(confirmations)) {
                            var socket = io(provider);
                            if (confirmations == 0) {
                                // we have to count the blocks and wait for 6 confirmations
                                console.log("we have to count the blocks and wait for 6 confirmations");
                                eventToListenTo = 'block';
                                room = 'inv';
                                socket.on('connect', function() {
                                    // Join the room.
                                    socket.emit('subscribe', room);
                                    console.log("listening for '" + eventToListenTo + "' in '" + room + "'");
                                });
                                socket.on(eventToListenTo, function(data) {
                                    console.log("New block received: " + data + " time: " + data.time);
                                    blockhash = data;
                                    // let's check if transaction is really in this block or not
                                    if (confirmations == 0) {
                                        $.getJSON(provider + 'insight-api-dash/txs/?block=' + blockhash, function(data) {
                                            var txs = data.txs;
                                            var found;
                                            var numOfTxs = txs.length;
                                            for (var i = 0; i < numOfTxs; i++) {
                                                console.log('txs' + i + ': ' + txs[i].txid);
                                                if (txs[i].txid == txidfield.val()) {
                                                    console.log('found tx!');
                                                    found = true;
                                                }
                                            }
                                            if (found) {
                                                console.log('all good. Count up confirmations.');
                                                confirmations = confirmations + 1;
                                                progbarval = 100/6*confirmations;
                                                $("#progressbar").progressbar({value: progbarval})
                                                    .children('.ui-progressbar-value')
                                                    .html(progbarval.toPrecision(3) + '%')
                                                    .css("display", "block");
                                                if (confirmations == 1) {
                                                    conftxt = 'confirmation';
                                                    conftxt2 = 'confirmations';
                                                }
                                                else if (confirmations == 5) {
                                                    conftxt = 'confirmations';
                                                    conftxt2 = 'confirmation';
                                                }
                                                else {
                                                    conftxt = 'confirmations';
                                                    conftxt2 = 'confirmations';
                                                }
                                                $("#progresstxt").text("Your transaction has " + confirmations + " " + conftxt + ". Waiting for " + (6 - confirmations) + " more " + conftxt2 + "...");
                                                console.log('we have ' + confirmations + ' confirmations...');
                                            }
                                            else {
                                                console.log('txid not in new block');
                                            }
                                        }).fail(function(jqXHR) {
                                            if (jqXHR.status == 400) {
                                                // there seems to be a problem with your feeTxid because txid is not found in api
                                                console.log('block hash not found in api!');
                                            } else {
                                                console.log('There seems to be a problem with the api connection. Maybe endpoint resyncing?');
                                            }
                                        });
                                    }
                                    else {
                                        // for the time being just count up the confirmations without confirming everytime if the transaction is still inside the previous blocks
                                        confirmations = confirmations + 1;
                                        progbarval = 100/6*confirmations;
                                        if (confirmations == 1) {
                                            conftxt = 'confirmation';
                                            conftxt2 = 'confirmations';
                                        }
                                        else if (confirmations == 5) {
                                            conftxt = 'confirmations';
                                            conftxt2 = 'confirmation';
                                        }
                                        else {
                                            conftxt = 'confirmations';
                                            conftxt2 = 'confirmations';
                                        }
                                        $("#progresstxt").text("Your transaction has " + confirmations + " " + conftxt + ". Waiting for " + (6 - confirmations) + " more " + conftxt2 + "...");
                                        console.log('we have ' + confirmations + ' confirmations...');
                                    }

                                    if (confirmations >= 6) {
                                        progbarval = 100;
                                        $("#progresstxt").text("Your transaction has " + confirmations + " confirmations. You can now submit the proposal.");
                                        $('.walletCommands#walletCommandsSubmit').removeClass('hidden');

                                        document.getElementById('step_four').click();
                                        document.getElementsByClassName('progress-bar')[0].style.width = "100%";
                                        document.getElementsByClassName('progress-bar')[0].innerText = "Success";
                                    }
                                    $("#progressbar").progressbar({value: progbarval})
                                        .children('.ui-progressbar-value')
                                        .html(progbarval.toPrecision(3) + '%')
                                        .css("display", "block");
                                });
                            }
                            else if (confirmations > 0 && confirmations <= 5) {
                                // we have to count the blocks and wait for outstanding confirmations
                                console.log("we have to count the blocks and wait for outstanding confirmations");
                                eventToListenTo = 'block';
                                room = 'inv';
                                socket.on('connect', function() {
                                    // Join the room.
                                    socket.emit('subscribe', room);
                                    console.log("listening for '" + eventToListenTo + "' in '" + room + "'");
                                });
                                socket.on(eventToListenTo, function(data) {
                                    console.log("New block received: " + data + " time: " + data.time);
                                    // for the time being just count up the confirmations without confirming everytime if the transaction is still inside the previous blocks
                                    confirmations = confirmations + 1;
                                    progbarval = 100/6*confirmations;
                                    $("#progressbar").progressbar({value: progbarval})
                                        .children('.ui-progressbar-value')
                                        .html(progbarval.toPrecision(3) + '%')
                                        .css("display", "block");
                                    if (confirmations = 1) {
                                        conftxt = 'confirmation';
                                        conftxt2 = 'confirmations';
                                    }
                                    else if (confirmations = 5) {
                                        conftxt = 'confirmations';
                                        conftxt2 = 'confirmation';
                                    }
                                    else {
                                        conftxt = 'confirmations';
                                        conftxt2 = 'confirmations';
                                    }
                                    $("#progresstxt").text("Your transaction has " + confirmations + " " + conftxt + ". Waiting for " + (6 - confirmations) + " more " + conftxt2 + "...");
                                    console.log('we have ' + confirmations + ' confirmations...');
                                    if (confirmations >= 6) {
                                        progbarval = 100;
                                        $("#progressbar").progressbar({value: progbarval})
                                            .children('.ui-progressbar-value')
                                            .html(progbarval + '%')
                                            .css("display", "block");
                                        $('.walletCommands#walletCommandsSubmit').removeClass('hidden');
                                    }
                                });
                            }
                            else {
                                // already reached 6 or more confirmations, so we can proceed
                                progbarval = 100;
                                $("#progressbar").progressbar({value: progbarval})
                                    .children('.ui-progressbar-value')
                                    .html(progbarval + '%')
                                    .css("display", "block");
                                $("#progresstxt").text("Your transaction has " + confirmations + " confirmations. You can now submit the proposal.");
                                console.log("already reached 6 or more confirmations, so we can proceed");
                                $('.walletCommands#walletCommandsSubmit').removeClass('hidden');
                            }
                        }
                        else {
                            console.log('Something went terribly wrong. Faulty api data?');
                            txidfield.attr("disabled", false);
                        }
                    }).fail(function(jqXHR) {
                        if (jqXHR.status == 400) {
                            // there seems to be a problem with your feeTxid because txid is not found in api
                            console.log('problem with feeTxid! Ask for new input!');
                            alert("Check again and please enter your correct TxID!");
                            txidfield.attr("disabled", false);
                        } else {
                            txidfield.attr("disabled", false);
                            console.log('There seems to be a problem with the api connection');
                        }
                    });
                }
                else {
                    $('#feeTxid').addClass('validationError');
                    $('#feeTxid').val('Your transacton ID is invalid. It must be alphanumeric. Please just copy & paste from console.');
                    console.log("there is something wrong with your transaction ID. It must be alphanumeric!")
                }
            }
            else {
                $('#feeTxid').addClass('validationError');
                $('#feeTxid').val('Your transacton ID is invalid. Please just copy & paste from console.');
                console.log("there is something wrong with your transaction ID. It must be exactly 64 characters!")
            }
        }
        else {
            $('textarea#submitProposal').val('');
            $('.walletCommands#walletCommandsSubmit').addClass('hidden');
        }

    });
}

function isAlphaNumeric(str) {
    var code, i, len;
    for (i = 0, len = str.length; i < len; i++) {
        code = str.charCodeAt(i);
        if (!(code > 47 && code < 58) && // numeric (0-9)
            !(code > 64 && code < 91) && // upper alpha (A-Z)
            !(code > 96 && code < 123)) { // lower alpha (a-z)
            return false;
        }
    }
    return true;
}
