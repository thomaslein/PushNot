(function() {
    var server = "http://192.168.56.25";
    
    var addPromotionToDOM = function addPromotionToDOM(promotionText) {
        $("#promotionParagraph").text(promotionText);
    }
    
    var getPromotionFromServer = function getPromotionFromServer() {
        console.log('### getting promotion text.');
        $.ajax(server + "/getPromotion", {
            type : "post",
            dataType: 'json'
        }).done(function (data) {
            console.log("### got promotion text.");
            addPromotionToDOM(data.text);
        });
    }

    var sendTokenToServer = function sendTokenToServer(token) {
        //we are making ajax post to our server to register device
        $.ajax(server + "/register", {
            type : "post",
            dataType: 'json',
            data: JSON.stringify({ 
                token: token,
                platform: device.platform
            }),
            success : function(response) {
                //we have successfully registered our device
                console.log("###Successfully registered device.");
            }
        });
    }
    
    var addCallback = function addCallback(key, callback) {
        if (window.pushCallbacks === undefined) {
            window.pushCallbacks = {}
        }
        window.pushCallbacks[key] = callback;
    };
    
    var pushNotification = window.plugins.pushNotification;
    
    var apnSuccessfulRegistration = function(token) {
        sendTokenToServer(token.toString(16));
        addCallback('onNotificationAPN', onNotificationAPN);
    }
    
    var apnFailedRegistration = function(error) {
        alert("Error: " + error.toString());
    }
    
    //this function is callback when we receive notifcation from APN
    var onNotificationAPN = function (e) {
        getPromotionFromServer();
    };
    
    //this function is callback for all GCM events
    var onNotificationGCM = function onNotificationGCM(e) {
         switch( e.event ) {
            case 'registered':
                if ( e.regid.length > 0 ) {
                    // Your GCM push server needs to know the regID before it can push to this device
                    // here is where you might want to send it the regID for later use.
                    console.log('###token received');
                    sendTokenToServer(e.regid);
                }
            break;
            case 'message':
                getPromotionFromServer();
            break;
            case 'error':
                alert('GCM error = ' + e.msg);
            break;
            default:
                alert('An unknown GCM event has occurred');
            break;
        }
    }
    
    var deviceReady = function() {
        if (device.platform == "iOS") {
            pushNotification.register(apnSuccessfulRegistration, 
                                      apnFailedRegistration, {
                                        "badge":"true",
                                        "sound":"true",
                                        "alert":"true",
                                        "ecb":"pushCallbacks.onNotificationAPN"
                                      }); 

        } else {
            //register for Google's GCM
            pushNotification.register(
                function(id) {
                    console.log("###Successfully sent request for registering with GCM.");
                    //sets GCM notification callback as global function
                    addCallback('onNotificationGCM', onNotificationGCM);
                },
                function(error) {
                    console.log("###Error " + error.toString());
                }, {
                    "senderID":"921067258193",
                    "ecb": "pushCallbacks.onNotificationGCM"
                }
            );
        }
    }
    document.addEventListener("deviceready", deviceReady , false);
}());