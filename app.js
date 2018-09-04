let fetch = require("isomorphic-fetch");


async function dataGetter() {
    let allData = [];
    let promises = [];
    for (let i = 0; i <=200; i++) {
        promises.push(fetch('http://api.tvmaze.com/shows?page=' + i))
    }
    for (let i = 0; i <= 200; i++) {
        let pageData = await promises[i]
        let json = await pageData.json();
        allData.push(...json);
    }
    return allData;
}

function getDaysWithRatings(shows) {
    let daysWithRatings = new Map();
    for (let i = 0; i < shows.length; i++) {
        const show = shows[i];
        if (show.rating.average !== null) {
            const days = show.schedule.days;
            days.forEach(day => {
                let ratingsOfTheDay = daysWithRatings.get(day)
                if (ratingsOfTheDay) {
                    daysWithRatings.set(day, ratingsOfTheDay.concat(show.rating.average))
                } else {
                    daysWithRatings.set(day, [show.rating.average]);
                }
            })
        }
    }
    return daysWithRatings;
}

function getAverage(value) {
    const reducer = (arr, acc) => arr + acc;
    const averageRating = value.reduce(reducer)/value.length;
    return averageRating;
}

function getDaysWithAverageRating(daysWithRatings) {
    let daysWithAverageRating = new Map();
    daysWithRatings.forEach((value, key) => {
        daysWithAverageRating.set(key, getAverage(value));
    });
    return daysWithAverageRating;
}

var people = {
    "Maksim": ["Drama", "Comedy"],
    "Viktorija": ["Drama", "Music"]
}

// {
//     drama: {
//         date:  {
//             rating: 9
//         }
//     }
// }
function getShowsByGenreAndDay(shows) {
    let showsByGenre = new Map();
    for (let i = 0; i < shows.length; i++) {
        const show = shows[i];
        const showRating = show.rating.average;
        if (showRating !== null) {
            const genres = show.genres;
            const days = show.schedule.days;
            genres.forEach(genre => {
                days.forEach(day => {
                    const genreInfo = showsByGenre.get(genre);
                    if (genreInfo == undefined) {
                        let showDays = new Map([[day, new Map([["ratings", [showRating]]])]]);
                        showsByGenre.set(genre, showDays)
                        return;
                    }
                    const dayInfo = genreInfo && genreInfo.get(day);
                    if (dayInfo == undefined) {
                        showsByGenre.get(genre).set(day, new Map([["ratings", [showRating]]]));
                        return;
                    }
                    let  existingRatings = dayInfo.get("ratings");
                    showsByGenre.get(genre).set(day, new Map([["ratings", existingRatings.concat(showRating)]]))
                })
            });
        }
    };
    return showsByGenre;
}


function getAveragesbyGendre(gendreRatingsMap) {
    let withRatingAverages = new Map();
    gendreRatingsMap.forEach((days, genre) => {
        let tempMap = new Map();
        days.forEach((dayInfo, day) => {
            const averageRating = getAverage(dayInfo.get("ratings"));

            tempMap.set(day, averageRating)
        })
        withRatingAverages.set(genre, tempMap)
    })
    return withRatingAverages;
}


function getDaysFor(people, shows) {
    const output = new Map();
    const showsByGenreAndDay = getAveragesbyGendre(getShowsByGenreAndDay(shows));
    Object.keys(people).forEach(person => {
        const personsgenres = people[person];
        let genreMap = new Map();
        // let genreMap = {};
        personsgenres.forEach(genre => {
            let goodDays = new Set();
            let badDays = new Set();
            const allDays = showsByGenreAndDay.get(genre)
            if (allDays) {
                allDays.forEach((value, key) => {
                    if (value >= 7.5 ) {
                        goodDays.add(key)
                    } else if (value < 7) {
                        badDays.add(key)
                    }
                });
            }
            genreMap.set(genre, {
                goodDays: goodDays,//JSON.stringify(Array.from(goodDays)),
                badDays: badDays,//JSON.stringify(Array.from(badDays)),
            })
        });
        output.set(person, genreMap);
    });
    return output;
}

function mostPeopleNearTV(peopleDays) {
    let days = new Map();
    peopleDays.forEach((genres, personsName) => {
        genres.forEach((value, genre) => {
            value.goodDays.forEach(day => {
                let numberOfPeople = days.get(day);
                if (numberOfPeople) {
                    days.set(day, numberOfPeople + 1)
                } else {
                    days.set(day, 1)
                }
            });
        })
    });

    //TODO fix
    let bestDayInfo = {};
    days.forEach((occurances, day) => {
        console.log("key", key)
        console.log("value", value)
        if (Object.keys(bestDayInfo).length === 0 || bestDayInfo[day] < occurances) {
            bestDayInfo[day] = occurances;
        }
    })
    const mostBusyDay = Object.keys(bestDayInfo);

    return mostBusyDay;
}


dataGetter().then(shows => {
    console.log("daysWithAverageRating", getDaysWithAverageRating(getDaysWithRatings(shows)));
    console.log(getDaysFor(people, shows));
    console.log("people on TV at: ", mostPeopleNearTV(getDaysFor(people, shows)))
})
