import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types' // ES6

const propTypes = {
  ...Image.propTypes,
  indicator: PropTypes.bool,
  indicatorColor: PropTypes.string,
  indicatorSize: PropTypes.oneOfType([
    PropTypes.oneOf(['small', 'large']),
    PropTypes.number,
  ]),
  originalHeight: PropTypes.number,
  originalWidth: PropTypes.number,
  defaultImageOnError: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.number,
  ]),
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

class FitImage extends Image {
  constructor(props) {
    super(props);

    this.style = StyleSheet.flatten(props.style);

    if (this.style) {
      const size = [this.style.width, this.style.height];

      if (size.filter(e => e).length === 1) {
        throw new Error('Props error: size props must be present ' +
                        'none or both of width and height.');
      }
    }

    const originalSize = [props.originalWidth, props.originalHeight];
    if (originalSize.filter(e => e).length === 1) {
      throw new Error('Props error: originalSize props must be present ' +
                      'none or both of originalWidth and originalHeight.');
    }

    this.isFirstLoad = true;

    this.state = {
      height: 0,
      isLoading: false,
      layoutWidth: undefined,
      originalWidth: undefined,
      originalHeight: undefined,
      isError: false,
    };

    this.getHeight = this.getHeight.bind(this);
    this.getOriginalHeight = this.getOriginalHeight.bind(this);
    this.getOriginalWidth = this.getOriginalWidth.bind(this);
    this.getRatio = this.getRatio.bind(this);
    this.getStyle = this.getStyle.bind(this);
    this.onLoad = this.onLoad.bind(this);
    this.onLoadStart = this.onLoadStart.bind(this);
    this.onError = this.onError.bind(this);
    this.renderChildren = this.renderChildren.bind(this);
    this.resize = this.resize.bind(this);
    this.setStateSize = this.setStateSize.bind(this);
  }

  componentDidMount() {
    if (this.props.originalWidth && this.props.originalHeight) return;

    let uri = this.state.isError ? this.props.defaultImageOnError : this.props.source.uri
    Image.getSize(uri, (originalWidth, originalHeight) => {
      this.setStateSize(originalWidth, originalHeight);
    }, (err) => {
      this.setStateSize(300, 300);
    });
  }

  onLoad() {
    this.setState({ isLoading: false });

    if(typeof this.props.onLoad === 'function') {
      this.props.onLoad();
    }
  }

  onLoadStart() {
    if (this.isFirstLoad) {
      this.setState({ isLoading: true });
      this.isFirstLoad = false;
    }
  }

  onError() {
    this.setState({ isLoading: false, isError: true });

    if (typeof this.props.onError === 'function') {
      this.props.onError();
    }
  }

  getHeight(layoutWidth) {
    if (this.style && this.style.height) {
      return this.style.height;
    }

    return this.getOriginalHeight() * this.getRatio(layoutWidth);
  }

  getOriginalHeight() {
    return this.props.originalHeight || this.state.originalHeight;
  }

  getOriginalWidth() {
    return this.props.originalWidth || this.state.originalWidth;
  }

  getRatio(width) {
    const layoutWidth = width || this.state.layoutWidth;

    return layoutWidth / this.getOriginalWidth();
  }

  getStyle() {
    if (this.style && this.style.width) {
      return { width: this.style.width };
    }
    return { flexGrow: 1 };
  }

  resize(event) {
    const { width } = event.nativeEvent.layout;
    const height = this.getHeight(width);

    this.setState({
      height,
      layoutWidth: width,
    });
  }

  setStateSize(originalWidth, originalHeight) {
    const height = this.state.layoutWidth / originalWidth;

    this.setState({
      height,
      originalHeight,
      originalWidth,
    });
  }

  renderChildren() {
    if (this.state.isLoading && this.props.indicator !== false) {
      return (
        <ActivityIndicator
          color={this.props.indicatorColor}
          size={this.props.indicatorSize}
        />
      );
    }

    return this.props.children;
  }

  render() {
    return (
      <Image
        {...this.props}
        onLayout={this.resize}
        onLoad={this.onLoad}
        onLoadStart={this.onLoadStart}
        onError={this.onError}
        source={this.state.isError ? this.props.defaultImageOnError : this.props.source}
        style={[
          this.style,
          this.getStyle(),
          { height: this.state.height },
          styles.container,
        ]}
      >
        {this.renderChildren()}
      </Image>
    );
  }
}

// Defaults for props
FitImage.defaultProps = {
  defaultImageOnError: require('./no-image-icon.jpg')
}

FitImage.propTypes = propTypes;

export default FitImage;
