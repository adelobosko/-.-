// ==UserScript==
// @name         ранобэ.рф trello integration (add comment of current page into a card)
// @namespace    https://raw.githubusercontent.com/adelobosko/xn--80ac9aeh6f.xn--p1ai/master/script.js
// @description  ранобэ.рф trello integration (add comment of current page into a card)
// @include      https://ранобэ.рф/*
// @include      https://xn--80ac9aeh6f.xn--p1ai/*
// @grant        none
// @author       Alexey Delobosko
// @version      1.0
// @grant GM_setValue
// @grant GM_getValue
// @run-at document-idle
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// ==/UserScript==
/* jshint -W097 */
'use strict';

var trelloCookieName = 'trelloAccessToken';
var trelloAccessUrl = 'https://trello.com/1/authorize?expiration=never&name=Ранобэ.рф&scope=read,write&response_type=token&key=7d0d6fa3ed4fe0b723201010a2b0dc19&return_url=';
var trelloToken = '';
var domainName = 'xn--80ac9aeh6f.xn--p1ai';

function createCssLink(id, href){
	var cssId = id;
	if (!document.getElementById(cssId))
	{
		var head  = document.getElementsByTagName('head')[0];
		var link  = document.createElement('link');
		link.id   = cssId;
		link.rel  = 'stylesheet';
		link.type = 'text/css';
		link.href = href;
		link.media = 'all';
		head.appendChild(link);
	}
}


function getCookie(name) {
  var matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}


function clearCookie(name, domain, path){
    var domain = domain || document.domain;
    var path = path || "/";
    document.cookie = name + "=; expires=" + +new Date + "; domain=" + domain + "; path=" + path;
};


function setCookie(name, value, options = {}) {
  options = {
    path: '/',
    ...options
  };

  if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
  }

  var updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

  for (var optionKey in options) {
    updatedCookie += "; " + optionKey;
    var optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += "=" + optionValue;
    }
  }

  document.cookie = updatedCookie;
}


function redirectToTrello(){
  var url = trelloAccessUrl+encodeURIComponent(document.location);
  document.location = url;
}


function createTrelloIcon(accessAllowed){
  var src = accessAllowed ? 'https://github.com/adelobosko/images/raw/master/trelloChecked.png' : 'https://github.com/adelobosko/images/raw/master/trelloUnchecked.png';
  var iconId = 'trelloScript';
  var imgHtml = '<img id="'+iconId+'" style="height:48px;cursor:pointer;" src="'+src+'"></img>';
  var menuHtml = '<li class="MobileMenu__item MobileMenu__item_chapters"><div class="Chapters MobileMenu__part MobileMenu__part_disabled"><div class="PopupButton PopupButton_disabled Chapters__toggler" data-id="chapters_popup_mobile" tabindex="0" role="button">'+imgHtml+'</div></div></li>';
 
  var imgElement = $('#'+iconId);
  if(imgElement.length > 0){
    imgElement.attr('src',src);    
  }
  else {
    $('ul.MobileMenu__list').append(menuHtml);
  }
  
  imgElement.unbind();    
  imgElement.click(function(){
    if(accessAllowed){
      if(confirm('Do you want to delete access token?')){        
        clearCookie(trelloCookieName, domainName);
        createTrelloIcon(false);
      }
    }
    else {
      redirectToTrello();
    }
  });
}


function checkUrl(){
  var urlStartText = '?token=';
  var url = document.location.toString();
  var startIndex = url.indexOf(urlStartText);
  if(startIndex < 0){
    urlStartText = '#token=';
    startIndex = url.indexOf(urlStartText);
    if(startIndex < 0){
      return;
    }
  }
  var token = url.substring(startIndex+urlStartText.length);
  clearCookie(trelloCookieName, domainName);
  setCookie(trelloCookieName, token, {domain: domainName, 'max-age': 31536000});    
}


function checkStatus(){
  checkUrl();
  trelloToken = getCookie(trelloCookieName);
  createTrelloIcon(trelloToken);
  
  setTimeout(checkStatus, 10000);
}


function initialize(){
  createCssLink('fontawesome', 'https://use.fontawesome.com/releases/v5.0.13/css/all.css');

  setTimeout(checkStatus, 3000);
}


var menu = {
	'script': {
		enabled: true
	},
	'playSound': {
		enabled: GM_getValue('playSound', true)
	}
};



initialize();
