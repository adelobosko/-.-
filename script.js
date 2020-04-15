// ==UserScript==
// @name         ранобэ.рф trello integration (add comment of current page into a card)
// @namespace    https://raw.githubusercontent.com/adelobosko/xn--80ac9aeh6f.xn--p1ai/master/script.js
// @description  ранобэ.рф trello integration (add comment (current page of novel) into a card)
// @include      https://ранобэ.рф/*
// @include      https://xn--80ac9aeh6f.xn--p1ai/*
// @grant        none
// @author       Alexey Delobosko
// @version      1.2
// @grant GM_setValue
// @grant GM_getValue
// @run-at document-idle
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// ==/UserScript==
/* jshint -W097 */
'use strict';

var trelloCookieName = 'trelloAccessToken';
var trelloCardIdCookieName = 'trelloCardId';
var trelloKey = '7d0d6fa3ed4fe0b723201010a2b0dc19';
var trelloAccessUrl = 'https://trello.com/1/authorize?expiration=never&name=Ранобэ.рф&scope=read,write&response_type=token&key='+trelloKey+'&return_url=';
var trelloToken = '';
var trelloCardId = '';
var domainName = 'xn--80ac9aeh6f.xn--p1ai';

var trelloIconId = 'trelloIcon';
var trelloMenuId = 'trelloMenu';

var currentChapterText = '';


const TrelloStatus = {
  'NOT_ALLOWED': 0,
  'ALLOWED_NOT_CONFIGURED': 1,
  'ALLOWED_CONFIGURED': 2
}

var trelloStatus = TrelloStatus.NOT_ALLOWED;


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
  var url = trelloAccessUrl+encodeURIComponent(document.location.toString());
  document.location = url;
}


function addComment(cardid, text){
  var xhr = new XMLHttpRequest();
  var body = 'text=' + encodeURIComponent(text)+'&key='+trelloKey+'&token='+trelloToken;
  
  xhr.open("POST", 'https://api.trello.com/1/cards/'+cardid+'/actions/comments', true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send(body);
}



function getCards(boardId){
  var xhr = new XMLHttpRequest();
  var body = 'key='+trelloKey+'&token='+trelloToken;
  xhr.open("GET", 'https://api.trello.com/1/boards/'+boardId+'/cards?' + body, true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onreadystatechange = function() {
    if(xhr.readyState === 4 && xhr.status === 200) {
      var cards = JSON.parse(xhr.responseText);
      var cardsHtml = '';
      for(var i = 0; i < cards.length; i++){
        var card = cards[i];
        cardsHtml += '<option value="'+card.id+'">'+card.name+'</option>';
      }
      
      $('#trelloCardSelect').html(cardsHtml);
    }
  }
  xhr.send();
}


var menu = {
	'create': function (boards) {
    this.isShown = !this.isShown;
    var logoutHtml = '<i id="trelloLogout" style="font-size:24px;padding-left:5px;float:left;color:red;cursor:pointer;" class="fas fa-sign-out-alt"></i>';
    var cardIconColor = trelloCardId ? 'green' : 'white';
    var cardHtml = '<i id="trelloCard" style="font-size:24px;padding-left:10px;float:left;color:'+cardIconColor+';cursor:pointer;" class="far fa-credit-card"></i>';
    var menuHtml = '<div id="'+trelloMenuId+'" style="display:'+(this.isShown ? 'block' : 'none')+';width:120px;position:fixed;bottom:64px;">'+logoutHtml+cardHtml+'</div>';
    
    
    var boardsHtml = 'Select board:<br><select id="trelloBoardSelect" value="-1">';
    var cardsHtml = '<br>Select card:<br><select id="trelloCardSelect" value="-2"></select>';
    for(var i = 0; i < boards.length; i++){
      var board = boards[i];
      console.log('board', board);
      if(board.closed === false){
        boardsHtml += '<option value="'+board.id+'">'+board.name+'</option>';
      }
    }
    boardsHtml += '</select>';
    
    
    var selectCardHtml = '<div id="trelloSelectCard" style="font-size:24px;color:green;display:'+($('#trelloSelectCard').css('display') === 'block' && this.isShown ? 'block' : 'none')+';width:80%;height:90%;position:fixed;top:10px;left:10px;">'+boardsHtml+cardsHtml+'</div>';
    
    if($('#'+trelloMenuId).length > 0){
      $('#'+trelloMenuId).remove();
    }
    
    $('#'+trelloIconId).parent().append(menuHtml);
    
    if($('#trelloSelectCard').length > 0){
      $('#trelloSelectCard').remove();
    }
    
    $('#root').html($('#root').html()+selectCardHtml);
    
    $('#trelloBoardSelect').unbind();
    $('#trelloBoardSelect').on('change', function() {
      getCards(this.value);
    });
    
    $('#trelloCardSelect').unbind();
    $('#trelloCardSelect').on('change', function() {      
      setCookie(trelloCardIdCookieName, this.value, {domain: domainName, 'max-age': 31536000});
      trelloCardId = this.value;
      
    });
    $('#trelloCard').unbind();
    $('#trelloCard').click(function(){
      $('#trelloSelectCard').css('display', ($('#trelloSelectCard').css('display') === 'none' ? 'block' : 'none'));
    });

    $('#trelloLogout').unbind();
    $('#trelloLogout').click(function(){
     if(confirm('Do you want to delete access token?')){
        clearCookie(trelloCookieName, domainName);
        clearCookie(trelloCardIdCookieName, domainName);
        trelloCardId = '';
        trelloToken = '';
        createTrelloIcon();
        menu.showOrHide(false);
      }
    });
  },
	'showOrHide': function(force){
    if($('#'+trelloMenuId).length > 0){
      if(force === true || force === false){
        this.isShown = force;
      }
      else {
        this.isShown = !this.isShown;
      }
      $('#'+trelloMenuId).css('display', this.isShown ? 'block' : 'none');
      $('#'+trelloSelectCard).css('display', (this.isShown  && $('#trelloSelectCard').css('display') === 'none' ? 'block' : 'none'));
      return;
    }
  },
  'isShown': false
};


function getBoards(){
  var xhr = new XMLHttpRequest();
  var body = 'key='+trelloKey+'&token='+trelloToken;
  xhr.open("GET", 'https://api.trello.com/1/members/me/boards?' + body, true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onreadystatechange = function() {
    if(xhr.readyState === 4 && xhr.status === 200) {
      var boards = JSON.parse(xhr.responseText);
      menu.create(boards);
    }
  }
  xhr.send();
}


function createTrelloIcon(){
  var src = 'https://github.com/adelobosko/images/raw/master/trelloUnchecked.png';
  
  if(trelloStatus === TrelloStatus.ALLOWED_NOT_CONFIGURED){
    src = 'https://raw.githubusercontent.com/adelobosko/images/master/trelloConfigure.png';
  }
  else if(trelloStatus === TrelloStatus.ALLOWED_CONFIGURED){
    src = 'https://github.com/adelobosko/images/raw/master/trelloChecked.png';
  }
  

  if($('#'+trelloIconId).length > 0){
    $('#'+trelloIconId).attr('src',src);    
  }
  else {
    var imgHtml = '<img id="'+trelloIconId+'" style="height:48px;cursor:pointer;" src="'+src+'"></img>';
    var menuHtml = '<li class="MobileMenu__item MobileMenu__item_chapters"><div class="Chapters MobileMenu__part MobileMenu__part_disabled"><div class="PopupButton PopupButton_disabled Chapters__toggler" data-id="chapters_popup_mobile" tabindex="0" role="button">'+imgHtml+'</div></div></li>';
 
    $('ul.MobileMenu__list').append(menuHtml);
  }
  
  $('#'+trelloIconId).unbind();    
  $('#'+trelloIconId).click(function(){
    if(trelloStatus === TrelloStatus.ALLOWED_CONFIGURED){
      getBoards();
    }
    else if(trelloStatus === TrelloStatus.ALLOWED_NOT_CONFIGURED){
      getBoards();
    }
    else if(trelloStatus === TrelloStatus.NOT_ALLOWED) {
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


function checkTrelloStatus(){
  trelloToken = getCookie(trelloCookieName);
  trelloCardId = getCookie(trelloCardIdCookieName);
  
  var status = TrelloStatus.NOT_ALLOWED;
  if(trelloToken){
    status = TrelloStatus.ALLOWED_NOT_CONFIGURED;
    
    if(trelloCardId){
      status = TrelloStatus.ALLOWED_CONFIGURED;
    }
  }
  
  return status;
}


function getChapterText(){
  var chapter = $('.ChapterContent__title');
  if(chapter.length > 0) {
    return chapter[0].innerText;
  }
  
  return currentChapterText;
}


function sendPageStatus(){
  if(trelloStatus !== TrelloStatus.ALLOWED_CONFIGURED){
    return;
  }
  
  var chapterText = getChapterText();
  
  
  if(currentChapterText === chapterText){
    return;
  }
  
  var text = chapterText+'\r\n'+document.location.toString();
  addComment(trelloCardId, text);
  currentChapterText = chapterText;
}


function checkStatus(){
  checkUrl();
  trelloStatus = checkTrelloStatus();
  createTrelloIcon();
  sendPageStatus();
  
  setTimeout(checkStatus, 3000);
}


function initialize(){
  createCssLink('fontawesome', 'https://use.fontawesome.com/releases/v5.0.13/css/all.css');

  setTimeout(checkStatus, 3000);
}



initialize();
