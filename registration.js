
var unms = require('./unms');

module.exports = {
    doRegistration: function(message_prefix) {
        sendReply(message_prefix + " Wat zijn de postcode en huisnummer van de internet aansluiting? (bijvoorbeeld '3456AA 6a')");
        waitForResponse("ask_postal", {
            timeoutMinutes: 60*3
        });
    },
    parse_postal: function() {
        parse_postal();
    }
};

function parse_postal() {
    var matches = content.match(/\s*([0-9]{4})\s*([A-Za-z]{2})\s*([0-9]+[A-Za-z]*)/);
    if (matches) {
        contact.vars.postcode = matches[1]+matches[2].toUpperCase();
        contact.vars.huisnummer = matches[3].toLowerCase();
        var key = unms.get_key($UNMS_URL, $UNMS_USER, $UNMS_PASS);
        var client = unms.get_client($UNMS_URL, key, contact.vars.postcode + " " + contact.vars.huisnummer);
        if (client.client.length > 0) {
            sendReply("Dank u wel, wij hebben het volgende aansluitingsadres gevonden: " + client.address + ". ");
            contact.vars.adres = client.address;
            contact.vars.unmsclient = client.client;
            contact.save();
        } else {
            sendReply("Dank u wel. ")
        }

    } else {
        sendReply("Helaas konden wij geen postcode en huisnummer vinden in uw bericht. Stuur uw postcode en huisnummer als '1234NN 2a'");
        waitForResponse("ask_postal", {
            timeoutMinutes: 60*3
        });
        return;
    }
    sendReply("Wat is uw naam?");
    waitForResponse("ask_name", {
        timeoutMinutes: 60*5
    });
}

addResponseHandler('ask_postal', parse_postal);

addResponseHandler('ask_name', function() {
    contact.vars.naam = content;
    sendReply("Dank u wel. Nu u geregistreerd bent kunt u eenvoudig een storing melden door het woord STORING te sturen naar dit nummer.");
});