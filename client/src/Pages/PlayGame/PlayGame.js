import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import cookie from 'react-cookies'

import  Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';

import NumsGame from './NumsGame';
import BDman from './BDman';
import MoleGame from './MoleGame';

const styles = (theme) => ({
  paper: {
    backgroundColor: 'transparent',
    position: 'fixed',
    width: '90vw',
    height: '40vw',
    top: '50%',
    right: '50%',
    marginTop: '-20vw',
    marginRight: '-45vw',
  },
  space: {
    display: 'flex',
    height: window.innerHeight,
  },
  
});

class PlayGame extends Component {
  constructor(props){
    super(props);
    this.state = {
      gameHeight: 0,
      gameWidth: 0,
    }
    
    this.games = [
      {},{
        tag: <MoleGame />,
        color: '#00babd',
        id: '#molegame',
        shadow: '1px 1px 100px 0px #00535c',
      }, {
        tag: <BDman />,
        color: '#000',
        id: '#bdman',
        shadow: '-40px -40px 100px 0px #5c0200, 30px 30px 100px 0px #5e5d00',
      }, {
        tag: <NumsGame />,
        color: '#f0f0f0',
        id: '#numsgame',
        shadow: '1px 1px 100px 0px #d6d6d6',
      }
    ];
  }

  componentWillMount() {
    if (!cookie.load('selectedGame')) {
      this.props.history.push('/')
    } 
  }
  
  componentDidMount() {
    this.getWidth();
    window.addEventListener('resize', this.getWidth.bind(this), false);
  }

  getWidth() {
    this.setState({ gameWidth: window.innerWidth})
  }
  
  componentWillUnmount() {
    cookie.remove('isPlaying', { path: '/' })
    window.removeEventListener('resize', this.getWidth.bind(this), false);
  }

  render(){
    const { classes } = this.props;

    const selectedGame = this.games[cookie.load('selectedGame')];
    
    const style = {
      backgroundColor: 'transparent',
      position: 'fixed',
      top: '50%',
      right: '50%',
      height: `60vw`,
      width: `90vw`,
      marginTop: `-30vw`,
      marginRight: `-45vw`,
      boxShadow: selectedGame['shadow'],
      border: selectedGame.id === '#bdman' ? '0.1vw solid #fff' : '',
    }
    const fixedStyle = {
      backgroundColor: 'transparent',
      position: 'fixed',
      top: '50%',
      right: '50%',
      height: 614,
      width: 922,
      marginTop: -307,
      marginRight: -461,
      boxShadow: selectedGame['shadow'],
      border: selectedGame.id === '#bdman' ? '0.1vw solid #fff' : '',
    }


    return (
      <div>
        {
          cookie.load('selectedGame')
          ? <div className={classes.space} 
              style={{ backgroundColor: selectedGame['color'] }}
            >
              <Paper 
                id="gamePaper"
                style={this.state.gameWidth > 1024 ? fixedStyle : 
                        this.state.gameWidth > 700 ? style : 
                        null}
              >
                  { selectedGame['tag'] }
              </Paper> 
            </div>
          : null
        }
      </div>
    );
  }
};

PlayGame.propsTypes = {
  classes: PropTypes.object.isRequired,
}

export default withRouter(withStyles(styles)(PlayGame));
