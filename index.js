const startCoords = [40.751992, -73.977359]; //lat, lon
const endCoords = [40.710089, -74.007838]; //lat, lon
const time = new Date().valueOf();

const requestURL = `https://fw4484ssc8ssgs4go8c4k0s4.piero.digital/routing/connections?timeType=DEPARTURE&dateTime=${new Date(time).toISOString().split('.')[0]}&sourceLatitude=${startCoords[0]}&sourceLongitude=${startCoords[1]}&targetLatitude=${endCoords[0]}&targetLongitude=${endCoords[1]}&minTransferTime=0&wheelchairAccessible=false&bikeAllowed=false&travelModes=BUS&travelModes=RAIL&travelModes=SUBWAY`;

fetch(requestURL)
  .then((res) => res.json())
  .then(async (data) => {
    const segmentsRes = await fetch("https://gtfs.piemadd.com/data/nyct_subway/segments.json");
    const segmentsData = await segmentsRes.json();

    const stopsRes = await fetch("https://gtfs.piemadd.com/data/nyct_subway/stops.json");
    const stopsData = await stopsRes.json();

    let lineStrings = [];

    data.forEach((option) => {
      option.legs.forEach((segment) => {

        //non transit
        if (!segment.trip) {
          lineStrings.push({
            "type": "Feature",
            "properties": {
              "stroke": "orange",
            },
            "geometry": {
              "coordinates": [
                [
                  segment.from.longitude,
                  segment.from.latitude
                ],
                [
                  segment.to.longitude,
                  segment.to.latitude
                ]
              ],
              "type": "LineString"
            }
          })
          return;
        }

        // transit segment
        const firstStopIndex = segment.trip.stopTimes.findIndex((time) => time.stop.id == segment.fromStop.id);
        const lastStopIndex = segment.trip.stopTimes.findIndex((time) => time.stop.id == segment.toStop.id);

        const filteredStopTimes = segment.trip.stopTimes
          .filter((_, i) => i >= firstStopIndex && i <= lastStopIndex);

        // raw stations
        /*
        lineStrings.push({
          "type": "Feature",
          "properties": {
            "stroke": "red",
            "startID": filteredStopTimes[0].stop.id,
            "endID": filteredStopTimes[filteredStopTimes.length - 1].stop.id
          },
          "geometry": {
            "coordinates": filteredStopTimes
              .map((time) => [time.stop.coordinates.longitude, time.stop.coordinates.latitude]),
            "type": "LineString"
          }
        })
        */

        //station points
        filteredStopTimes.forEach((stopTime) => {
          console.log
          lineStrings.push({
            "type": "Feature",
            "properties": {
              fill: "pink",
              stopID: stopTime.stop.id,
              stopName: stopTime.stop.name
            },
            "geometry": {
              "coordinates": [stopTime.stop.coordinates.longitude, stopTime.stop.coordinates.latitude],
              "type": "Point"
            }
          })
        })

        //slightly better geometry
        let segmentKeys = [];
        filteredStopTimes.forEach((stopTime, i, arr) => {
          if (i == arr.length - 1) return; //last

          const firstStopID = stopsData[stopTime.stop.id].parentStation.length > 0 ? stopsData[stopTime.stop.id].parentStation : stopTime.stop.id;
          const lastStopID = stopsData[filteredStopTimes[i + 1].stop.id].parentStation.length > 0 ? stopsData[filteredStopTimes[i + 1].stop.id].parentStation : filteredStopTimes[i + 1].stop.id;

          segmentKeys.push(`${firstStopID}_${lastStopID}`);
        })

        console.log(segmentKeys)

        segmentKeys.forEach((segment) => {
          console.log(segment, segmentsData.segments[segment].shape.length)

          lineStrings.push({
            "type": "Feature",
            "properties": {
              "stroke": "blue",
              "segment": segment,
            },
            "geometry": {
              "coordinates": segmentsData.segments[segment].shape,
              "type": "LineString"
            }
          })
        })
      })
    })

    //console.log(data);
    console.log(JSON.stringify({ "type": "FeatureCollection", "features": lineStrings }))
    console.log(requestURL);
  })