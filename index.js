var redirect_uri = 'http://127.0.0.1:3003/index.html';

var client_id = "7aec7613dd6840dab4de83e43e5665e6";
var client_secret = "cd861cec74034e89a9b271b0079cad69";

const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = "https://accounts.spotify.com/api/token";

document.querySelector('.login-button').addEventListener('click', function () {
        requestAuthorization();
});

window.addEventListener('load', function () {
    onPageLoad();
});

function onPageLoad() {
    if (window.location.search.length > 0) {
        handleRedirect();
    }
}

function handleRedirect() {
    let code = getCode();
    fetchAccessToken(code);
    window.history.pushState("", "", redirect_uri);
}

function getCode() {
    return window.location.search.split('code=')[1];
}

function fetchAccessToken(code) {
    var body = "grant_type=authorization_code";	
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    fetch(TOKEN , {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(client_id + ':' + client_secret)
        },
        body: body
    }) 
    .then(response => {
        if(!response.ok){
            throw new Error('Failed to fetch the access token');
        }
        return response.json();
    })
    .then(data => {
        localStorage.setItem("tokens", JSON.stringify(data));
        console.log(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function requestAuthorization() {
    var url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-top-read";

    window.location.href = url;
}

document.querySelector('.user-button').addEventListener('click', getUserDetails);

function getUserDetails() {

    var tokens = JSON.parse(localStorage.getItem("tokens"));

    fetch("https://api.spotify.com/v1/me" ,{
        method : "GET",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + tokens.access_token
        }
    })
    .then(response => {
        if(!response.ok){
            throw new Error('Failed to fetch the user profile details');
        }
        return response.json();
    })
    .then( data  => {
        if(data.error && data.error === 401){
            console.log("Token expired");
            // fetchAccessToken(tokens.refresh_token);
        } else {
            var user_details = data;
            localStorage.setItem("user", JSON.stringify(user_details));
            console.log(user_details);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

document.querySelector('.artists-button').addEventListener('click', function() { getTop5("artists"); });
document.querySelector('.tracks-button').addEventListener('click', function() { getTop5("tracks"); });

function getTop5(type) {
    var tokens = JSON.parse(localStorage.getItem("tokens"));

    fetch('https://api.spotify.com/v1/me/top/' + type ,{
        method : "GET",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + tokens.access_token
        }
    })
    .then(response => {
        if(!response.ok){
            throw new Error('Failed to fetch the top 5 ' + type + ': ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        if (type === 'artists') {
            var top_artists = data.items.map(artist => artist.name);
            localStorage.setItem("artists", JSON.stringify(top_artists));
            console.log('Top Artists:', top_artists);
        } else if (type === 'tracks') {
            var top_tracks = data.items.map(track => track.album.name);
            localStorage.setItem("tracks", JSON.stringify(top_tracks));
            console.log('Top Songs:', top_tracks);
        } else {
            console.log('Unknown type:', type);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

document.querySelector('.logout-button').addEventListener('click', logout);

function logout() {
    localStorage.removeItem("tokens");
    localStorage.removeItem("user");
    localStorage.removeItem("artists");
    localStorage.removeItem("tracks");
    console.log("Logged out successfully");
    
    window.location.href = redirect_uri;
}

