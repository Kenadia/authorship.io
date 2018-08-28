/**
 * A component which updates itself each second.
 *
 * Adapted from https://openclassrooms.com/en/courses/4286486-build-web-apps-with-reactjs/4286711-build-a-ticking-clock-component
 */

import React from 'react'

export function getUnixTimestamp() {
  return Math.round((new Date()).getTime() / 1000)
}

export function timestampToString(unixTimestampSeconds) {
  return new Date(unixTimestampSeconds * 1000).toLocaleString()
}

export class Clock extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      time: getUnixTimestamp()
    }
  }

  componentDidMount() {
    this.intervalID = setInterval(() => this.tick(), 500)
  }

  componentWillUnmount() {
    clearInterval(this.intervalID)
  }

  tick() {
    this.setState({
      time: getUnixTimestamp()
    })
  }

  render() {
    return (
      <span>
        {this.state.time}
        &nbsp;<span className="small-text">({timestampToString(this.state.time)})</span>
      </span>
    )
  }
}
