import jquery from 'jquery';
import CONST from './consts'
import gameController from './app'
import utils from './utils';

var $ = jquery;
const { KEY_CODES } = CONST

export default class Typer {
  constructor(renderManager){
    console.log('Typer initing...');

    this.render = renderManager;

    this.project = null;
    this.speed = 10;
    this.isTyping = false;

    this.typeCodeHandler = null;
    this.shortCutsHandler = null;
    this.cursorInterval = null;
    this.lastTypedKey = null;

    console.log('Typer inited');
  }

  prepareCode(code) {
    var text=$("<div/>").text(code.substring(0, this.project.progress)).html();

    var rtn= new RegExp("\n", "g");
    var rts= new RegExp("\\s", "g");
    var rtt= new RegExp("\\t", "g");

    return text.replace(rtn,"<br/>").replace(rtt,"&nbsp;&nbsp;&nbsp;&nbsp;").replace(rts,"&nbsp;");
  }

  calculatePercentage() {
    let {length, progress} = this.project;
    let percentages = utils.getProgresPercentage(this.project);
    $('#progress').text("Progress: "+percentages+"%");
  }

  clearPercentages() {
    $('#progress').text("");
  }

  breakTyping() {
    this.stopTyping(false);
  }

  deleteLastCode(e) {
    this.index -= 2*this.speed;
    this.typeCode({});
  }

  getSpeed(e) {
    if(e.keyCode === this.lastTypedKey) return 0;
    else return this.speed;
  }

  getCode() {
    return this.prepareCode(this.codeSnippet)
  }

  saveKey(e) {
    this.lastTypedKey = e.keyCode;
  }

  typeCode(e){
    this.calculatePercentage()
    let synteticEvent = gameController.tryEvent(this.project);
    if(!this.isTyping) return false;
    if(!synteticEvent.canContinue) {
      this.breakTyping();
      synteticEvent.callback();
    }
    const code = this.getCode()
    this.render.html(code);
    window.scrollBy(0, window.outerHeight);
    this.project.progress += this.getSpeed(e);
    if(this.project.progress > this.project.length) this.project.progress = this.project.length;
    this.saveKey(e);
    gameController.saveProject(this.project)
    if(this.project.progress >= this.project.length) {
      this.breakTyping();
      gameController.projectComplete(this.project);
    }
  }

  updateCursor() {
    let content = this.render.getHtml();
    if(content.substring(content.length-1, content.length) === "|") {
      this.render.removeLastChar(1);
    }
    else {
      this.render.render('|');
    }
  }

  handleShortCut(e) {
    if(e.ctrlKey && e.keyCode == 67) {
      this.stopTyping();
    }
    else if(e.keyCode == KEY_CODES.BACKSPACE) {
      this.deleteLastCode(e);
      e.preventDefault();
    }
  }

  startTyping(code, gameData) {
    console.log('Going to type:', gameData);
    this.isTyping = true;
    this.project = gameData;
    this.codeSnippet = code;

    let typeCodeHandler = this.typeCode.bind(this)
    let shortCutsHandler = this.handleShortCut.bind(this);
    let cursorInterval = setInterval(this.updateCursor.bind(this), 500);
    this.typeCodeHandler = typeCodeHandler;
    this.shortCutsHandler = shortCutsHandler;
    this.cursorInterval = cursorInterval;
    $(document).on('keypress', typeCodeHandler);
    // $(document).unbind('keydown').bind('keydown', preventBackSpace);
    $(document).on('keydown', shortCutsHandler)
  }

  stopTyping(showInput = true) {
    this.isTyping = false;

    let typeCodeHandler = this.typeCodeHandler;
    let shortCutsHandler = this.shortCutsHandler;
    let cursorInterval = this.cursorInterval;
    $(document).off('keypress', typeCodeHandler)
    $(document).off('keydown', shortCutsHandler)
    clearInterval(cursorInterval);
    this.clearPercentages()
    gameController.clear(showInput);
    gameController.saveProject(this.project)
  }
}
