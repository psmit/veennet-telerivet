var UNMS_BASE = "v2.1";


module.exports = {
    get_key: function (url, user, pass) {

        var ukey = "";
        var table = project.getOrCreateDataTable('vars');

        var rows = table.queryRows({
            // vars: {
            //     'unms[exists]': 1,
            // },
            sort_dir: 'desc'
        });

        console.log(rows.count());
        if (rows.hasNext()) {
            ukey = rows.next().vars.unms;
        }

        delete rows;

        if (ukey.length > 0) {
            console.log("Check if key is valid");
            var r = httpClient.request(url + '/' + UNMS_BASE + '/user', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=UTF_8',
                    'x-auth-token': ukey
                }
            });
            if (r.status !== 200) {
                ukey = "";
            }
        }
        if (ukey.length === 0) {
            console.log("Go and make call to get fresh key");
            ukey = get_authtoken(url, user, pass);
            if (ukey.length > 0) {
                table.createRow({
                    vars: {
                        unms: ukey
                    }
                }).save();
            }
        }
        return ukey;
    },
    get_client: function(url, key, s) {
        var client = "";
        var address = "";
        var r = httpClient.request(url + '/' + UNMS_BASE + '/sites', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=UTF_8',
                'x-auth-token': key
            }
        });
        if (r.status === 200) {
            for each (site in JSON.parse(r.content)) {
                if (site.identification.name.indexOf(s) === 0) {
                    client = site.identification.id;
                    address = site.description.address;
                    break;
                }
            }
        }
        return {client: client,
            address: address};
    },
    get_outage: function(url, key, c) {
        return get_outage_real(url, key, c, true)
    }

};


function get_outage_real(url, key, c, query_parent) {
    var success = false;
    var currentOutage = false;
    var lastOutageStart = "";
    var lastOutageEnd = "";
    var parentCurrentOutage = false;

    var r = httpClient.request(url + '/' + UNMS_BASE + '/outages', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=UTF_8',
            'x-auth-token': key
        },
        params: {
            count: '1',
            page: '1',
            siteId: c,
            period: '259200000'
        }
    });

    if (r.status === 200) {
        success = true;
        outages = JSON.parse(r.content);
        if (outages.items.length > 0) {
            outage = outages.items[0];
            currentOutage = outage.inProgress;
            lastOutageStart = outage.startTimestamp;
            lastOutageEnd = outage.endTimestamp;
        }

        if(query_parent) {
            parentCurrentOutage = get_outage_real(url, key, outage.device.site.parent, false).currentOutage;
        }
    }

    return {
        success: success,
        currentOutage: currentOutage,
        lastOutageStart: lastOutageStart,
        lastOutageEnd: lastOutageEnd,
        parentCurrentOutage: parentCurrentOutage
    }
}


function get_authtoken(url,user,pass) {
    console.log("get a real fresh key");

    var body = {};
    body['username'] = user;
    body['password'] = pass;
    body['sessionTimeout'] = 36000000;

    var r = httpClient.request(url + '/' + UNMS_BASE + '/user/login', {
        method: 'POST',
        data: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json; charset=UTF_8'
        }
    });
    console.log("I made a request");

    if (r.status === 200) {
        return r.headers['x-auth-token'];
    } else {
        console.log("Fail " + r.status + r.content);
        return "";
    }
}