import React, { Component } from 'react';
import io from 'socket.io-client';
import PropTypes from 'prop-types';
import cookie from 'react-cookies';
import Gameover from '../../Components/PlayGame/Gameover';
import MoleScoreCard from '../../Components/PlayGame/MoleScoreCard';

import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import { Block } from './Block';
import { Ball } from './Ball';
import { isDeleteExpression } from 'typescript';

import { Mole } from './mole';
import hemmer from '../../images/hemmer.png';
import clicked from '../../images/clicked.png';

// png파일을 gif처럼 만들기위한 배열
let gif = [];

const styles = (theme) => ({
  Paper: {
    backgroundColor: theme.palette.background.paper,
    border: '1px solid #000',
    boxShadow: theme.shadows[5],
    margin: theme.spacing(3, 3),
  },
});

let blockX;
let dx = 10;
let preKey;
let moles = [];

class MoleGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      winner: '',
      myScore: 0,
      opponentScore: 0,
      opponentUsername: '',
      width: document.body.clientWidth / 1.5,
      height: document.body.clientHeight / 1.5,
      currentMole: 0,
    };
    this.canvas = null;
    this.ctx = null;
    this.stageWidth = null;
    this.stageHeight = null;

    this.clicked = true;

    this.cursorX = null;
    this.cursorY = null;
    this.cursorEnter = false;
    this.cursorClick = false;

    this.gifCount = 0;

    // socket connection endpoint
    this.socket = io('http://localhost:3009');

    for (let i = 0; i < 16; i++) {
      moles.push(
        new Mole(document.body.clientWidth / 1.5, document.body.clientHeight / 1.5, 15, i)
      );
    }
  }

  componentDidMount() {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.hemmer = document.getElementById('hemmer');
    this.clickedCursor = document.getElementById('clicked');

    // 분리된 gif의 png를 배열에 추가
    var req = require.context('../../images/gif', false, /.*\.png$/);
    req.keys().forEach(function (key) {
      gif.push(req(key));
    });

    // 화면크기 재설정 이벤트
    // window.addEventListener('resize', this.resize.bind(this), false);
    this.resize();
    window.requestAnimationFrame(this.animate.bind(this));

    this.canvas.addEventListener(
      'mousedown',
      (e) => {
        this.mousePressed(e.layerX, e.layerY);
        this.cursorClick = true;
      },
      false
    );

    this.canvas.addEventListener(
      'mouseup',
      (e) => {
        this.cursorClick = false;
      },
      false
    );

    this.canvas.addEventListener('mousemove', (e) => {
      this.cursorEnter = true;
      this.cursorX = e.layerX;
      this.cursorY = e.layerY;
    });

    this.canvas.addEventListener('mouseleave', (e) => {
      this.cursorEnter = false;
    });

    // socket connection
    this.socket.emit('gameStart', cookie.load('username'), 'someRoomId');
    this.socket.on('generateMole', (index) => {
      this.setState({ currentMole: this.state.currentMole + 1 });
      this.randomMole(index);
    });
    this.socket.on('updateScore', (data) => {
      /**
       * data = {
       *    index: 0~15,
       *    score: {
       *      player1: 0,
       *      player2: 10,
       *    }
       * }
       */
      moles[data.index].hideMole();
      const [player1, player2] = Object.keys(data.score);
      if (player1 === cookie.load('username')) {
        this.setState({ myScore: data.score[player1], opponentScore: data.score[player2] });
      } else {
        this.setState({ myScore: data.score[player2], opponentScore: data.score[player1] });
      }
    });
    this.socket.on('gameover', (data) => {
      // data = username
      this.setState({ winner: data });
    });
    this.socket.on('init', ([usernames, currentMole, score]) => {
      const opponentUsername = usernames.filter((username) => cookie.load('username') !== username);
      const players = Object.keys(score);
      let myScore, opponentScore;
      players.forEach((player) => {
        if (player === cookie.load('username')) {
          myScore = score[player];
        } else {
          opponentScore = score[player];
        }
      });
      this.setState({ opponentUsername, currentMole, myScore, opponentScore });
    });
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  mousePressed(mouseX, mouseY) {
    for (let i = 0; i < moles.length; i++) {
      let clickedMole = moles[i].clicked(mouseX, mouseY, i, this.ctx);
      if (clickedMole) {
        const data = {
          gameRoomId: 'someRoomId',
          currentMole: this.state.currentMole,
          username: cookie.load('username'),
          index: clickedMole,
        };
        this.socket.emit('moleClick', data);
      }
    }
  }

  // moles배열에서 랜덤한 인덱스의 mole이 나옴
  randomMole(index) {
    moles[index].showMole();
  }

  // 화면그리기
  animate(t) {
    window.requestAnimationFrame(this.animate.bind(this));
    this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);

    // moles의 모든 요소를 각자의 위치에 생성
    for (let i = 0; i < moles.length; i++) {
      moles[i].draw(this.ctx, this.canvas.width, this.canvas.height, this.gifCount);
    }

    // gif 움직임 생성
    this.gifCount += 1;
    if (this.gifCount === 47) this.gifCount = 0;
    let imgtest = new Image();
    imgtest.src = gif[this.gifCount];
    this.ctx.drawImage(imgtest, 10, this.canvas.height - 50, 70, 50);

    // 마우스가 canvas에 들어온 경우 망치이미지 생성
    if (this.cursorEnter) {
      if (this.cursorClick) {
        this.ctx.drawImage(this.clickedCursor, this.cursorX - 20, this.cursorY - 40, 50, 50);
      } else {
        this.ctx.drawImage(this.hemmer, this.cursorX - 20, this.cursorY - 40, 50, 50);
      }
    }
  }

  // 화면크기 재설정 함수
  resize() {
    this.stageWidth = document.body.clientWidth;
    this.stageHeight = document.body.clientHeight;

    this.canvas.width = this.stageWidth / 1.5;
    this.canvas.height = this.stageHeight / 1.5;

    this.setState({ width: this.canvas.width, height: this.canvas.height });
  }

  render() {
    const { classes } = this.props;

    return (
      <div>
        {this.state.winner !== '' ? <Gameover winner={this.state.winner} /> : null}
        <Paper
          id='paper'
          style={{
            width: this.state.width,
            height: this.state.height,
            cursor: 'none',
          }}
          className={classes.Paper}
        >
          <canvas id='canvas' />
          <img id='hemmer' src={hemmer} style={{ width: '40px', display: 'none' }} />
          <img id='clicked' src={clicked} style={{ width: '40px', display: 'none' }} />
        </Paper>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <MoleScoreCard score={this.state.myScore} player={cookie.load('username')} />
          <MoleScoreCard score={this.state.opponentScore} player={this.state.opponentUsername} />
        </div>
      </div>
    );
  }
}

MoleGame.propsTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MoleGame);
