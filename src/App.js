import React from "react";

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

class App extends React.Component {
  state = {
    location: "",
    isLoading: false,
    displayLocation: "",
    weather: {},
  };

  // we need to bing the 'this' function and we declare state here
  // this is why we need the constructor in this main app component
  // constructor(props) {
  // super(props);
  // giving this method explicit access to the current component instance
  // this.fetchWeather = this.fetchWeather.bind(this);
  // this.handleChange = this.handleChange.bind(this);
  // }

  handleChange = (e) => {
    console.log("exp");
    console.log(e.target);
    // set location
    this.setState({ location: e.target.value });
  };

  // wait for enter keypress
  handleKeyPress = (e) => {
    if (e.key === "Enter") {
      this.fetchWeather();
    }
  };

  // async fetchWeather() {
  fetchWeather = async () => {
    if (this.state.location.length < 2) {
      return this.setState({ weather: {} });
    }

    try {
      this.setState({ isLoading: true });
      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${this.state.location}`
      );
      const geoData = await geoRes.json();
      console.log(geoData);

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);
      console.log(`${name} ${convertToFlag(country_code)}`);

      this.setState({
        displayLocation: `${name} ${convertToFlag(country_code)}`,
      });

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      console.log(weatherData.daily);
      this.setState({ weather: weatherData.daily });
    } catch (err) {
      console.error(err);
    } finally {
      this.setState({ isLoading: false });
    }
  };

  // useEffect []
  componentDidMount() {
    // inital side effects here
    // this.fetchWeather();
    this.setState({ location: localStorage.getItem("location" || "") });
  }

  // useEffect []
  componentDidUpdate(prevProps, prevState) {
    if (this.state.location !== prevState.location) {
      this.fetchWeather();

      // set location in local storage
      localStorage.setItem("location", this.state.location);
    }
  }

  render() {
    return (
      <div className="app">
        <h1>Classy Weather</h1>
        <Input
          location={this.state.location}
          onChangeLocation={this.handleChange}
          onKeyPress={this.handleKeyPress}
        />
        {/* <button onClick={this.fetchWeather}>Get Weather</button> */}
        {this.state.isLoading && <p className="loader">Loading ...</p>}
        {this.state.weather.weathercode && (
          <Weather
            weather={this.state.weather}
            location={this.state.displayLocation}
          />
        )}
      </div>
    );
  }
}

export default App;

{
  /* passed down by props to component */
}
class Input extends React.Component {
  componentWillUnmount() {}

  render() {
    return (
      <div>
        <input
          type="text"
          placeholder="Search from Location"
          value={this.props.location}
          onChange={this.props.onChangeLocation}
          onKeyDown={this.props.onKeyPress}
        />
      </div>
    );
  }
}

class Weather extends React.Component {
  render() {
    console.log(this.props);

    const {
      temperature_2m_max: maxTemp,
      temperature_2m_min: minTemp,
      time: dates,
      weathercode: codes,
    } = this.props.weather;

    return (
      <div>
        <h2>Weather {this.props.location}</h2>
        <ul className="weather">
          {dates.map((date, i) => (
            <Day
              date={date}
              max={maxTemp.at(i)}
              min={minTemp.at(i)}
              code={codes.at(i)}
              key={date}
              isToday={i === 0}
            />
          ))}
        </ul>
      </div>
    );
  }
}

class Day extends React.Component {
  render() {
    const { date, max, min, code, isToday } = this.props;
    return (
      <li className="day">
        <span>{getWeatherIcon(code)}</span>
        <p>{isToday ? "Today" : formatDay(date)}</p>
        <p>
          {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong>
        </p>
      </li>
    );
  }
}
