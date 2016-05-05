var videoStyle = {
  width: '100%',
  height: '100%',
  backgroundColor: '#000'
};

var WatchPage = React.createClass({
  propTypes: {
    name: React.PropTypes.string,
  },
  getInitialState: function() {
    return {
      downloadStarted: false,
      readyToPlay: false,
      loadStatusMessage: "Requesting stream",
    };
  },
  componentDidMount: function() {
    lbry.getStream(this.props.name);
    this.updateLoadStatus();
  },
  onCanPlay: function() {
    this.setState({
      readyToPlay: true
    });
  },
  updateLoadStatus: function() {
    lbry.getFileStatus(this.props.name, (status) => {
      if (!status || status.code != 'running' || status.written_bytes == 0) {
        // Download hasn't started yet, so update status message (if available) then try again
        if (status) {
          this.setState({
            loadStatusMessage: status.message
          });
        }
        setTimeout(() => { this.updateLoadStatus() }, 250);
      } else {
        this.setState({
          loadStatusMessage: "Buffering",
          downloadStarted: true,
        });
      }
    });
  },
  render: function() {
    if (!this.state.downloadStarted) {
      var video = null;
    } else {
      // If the download has started, render the <video> behind the scenes so it can start loading.
      // When the video is actually ready to play, the loading text is hidden and the video shown.
      var video = <video src={"/view?name=" + this.props.name} style={videoStyle}
                         className={this.state.readyToPlay ? '' : 'hidden'} controls
                         onCanPlay={this.onCanPlay} />;
    }

    return (
      <main>
      <div className={this.state.readyToPlay ? 'hidden' : ''}>
        <h3>Loading lbry://{this.props.name}</h3>
        {this.state.loadStatusMessage}...
      </div>
      {video}
      </main>
    );
  }
});
