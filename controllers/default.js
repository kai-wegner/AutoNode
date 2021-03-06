exports.install = function(framework) {
    framework.route('/', processMessage, ['json']);
    framework.route('/', view_homepage, ['get']);
    framework.route('#400', error400);
    framework.route('#401', error401);
    framework.route('#403', error403);
    framework.route('#404', error404);
    framework.route('#408', error408);
    framework.route('#431', error431);
    framework.route('#500', error500);
};

// Bad Request
function error400() {
    console.log("Error 400");  
    var self = this;
    self.status = 400;
    self.plain(utils.httpStatus(self.status));
}

// Unauthorized
function error401() {
    var self = this;
    self.status = 401;
    self.plain(utils.httpStatus(self.status));
}

// Forbidden
function error403() {
    var self = this;
    self.status = 403;
    self.plain(utils.httpStatus(self.status));
}

// Not Found
function error404() {
    var self = this;
    self.status = 404;
    self.plain(utils.httpStatus(self.status));
}

// Request Timeout
function error408() {
    var self = this;
    self.status = 408;
    self.plain(utils.httpStatus(self.status));
}

// Request Header Fields Too Large
function error431() {
    var self = this;
    self.status = 431;
    self.plain(utils.httpStatus(self.status));
}

// Internal Server Error
function error500() {
    var self = this;
    self.status = 500;
    self.plain(utils.httpStatus(self.status));
}

function view_homepage() {
    var self = this;

    console.log("Processing homepage");    
    var messages = self.functions('messages');

    if (self.get.message != null || self.post.message != null)
        messages.processMessage(self);
    else {
        self.view('homepage', {
            webSocketURL_client: framework.config.webSocketURL_client
        });
    }
}

function processMessage() {

    console.log("Processing message");   
    var messages = this.functions('messages'); 
    messages.processMessage(this);
}