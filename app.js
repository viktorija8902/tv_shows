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


/* Outut:
    Map {
        'Thursday' => 7.375000000000009,
        'Tuesday' => 7.370083682008374,
        'Friday' => 7.345962732919264,
        'Monday' => 7.3814254859611275,
        'Sunday' => 7.664818355640547,
        'Wednesday' => 7.3611909650924074,
        'Saturday' => 7.6586046511627845 
    }
 */  
function getDaysWithAverageRating(daysWithRatings) {
    let daysWithAverageRating = new Map();
    daysWithRatings.forEach((ratings, day) => {
        daysWithAverageRating.set(day, getAverage(ratings));
    });
    return daysWithAverageRating;
}

/*Output:
    Map {
        day: [ratings],
        ...: [...]
    }
*/
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



const people = {
    "Maksim": ["Drama", "Comedy"],
    "Viktorija": ["Drama", "Music"]
}

/* Output:
    Map {
        'Maksim' => Map {
            'Drama' => { goodDays: [Set], badDays: Set {} },
            'Comedy' => { goodDays: [Set], badDays: Set {} } 
        },
        'Viktorija' => Map {
            'Drama' => { goodDays: [Set], badDays: Set {} },
            'Music' => { goodDays: Set {}, badDays: [Set] }
        } 
    }
*/
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

/*Output:
    Map {
        genre: {
            day: rating,
        },
        ...
    }
*/
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

/* Outpus:
    {
        genre: {
            day:  {
                ratings: [9,10,7,6]
            }
        },
        ...
    }
*/
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



/* Input:
    Map {
        'Maksim' => Map {
            'Drama' => { goodDays: [Set], badDays: Set {} },
            'Comedy' => { goodDays: [Set], badDays: Set {} } 
        },
        'Viktorija' => Map {
            'Drama' => { goodDays: [Set], badDays: Set {} },
            'Music' => { goodDays: Set {}, badDays: [Set] }
        } 
    }
*/
function mostPeopleNearTV(peopleDays) {
    const daysPeople = peopleDuringTheDays(peopleDays);
    console.log(daysPeople)
    const mostPopularDay = getMostPopularDay(daysPeople);
    return mostPopularDay;
}

/* Input:
    Map {
        'Maksim' => Map {
            'Drama' => { goodDays: [Set], badDays: Set {} },
            'Comedy' => { goodDays: [Set], badDays: Set {} } 
        },
        'Viktorija' => Map {
            'Drama' => { goodDays: [Set], badDays: Set {} },
            'Music' => { goodDays: Set {}, badDays: [Set] }
        } 
    }
    
    Output: 
    Map {
        'Tuesday' => 2,
        'Friday' => 2,
        'Monday' => 2,
        'Sunday' => 2,
        'Wednesday' => 2,
        'Saturday' => 3 
    }
*/
function peopleDuringTheDays(peopleDays) {
    let daysPeople = new Map();
    peopleDays.forEach((genres, personsName) => {
        genres.forEach((goodBadDays, genre) => {
            goodBadDays.goodDays.forEach(day => {
                let peopleOnThatDay = daysPeople.get(day);
                if (peopleOnThatDay) {
                    daysPeople.set(day, peopleOnThatDay + 1)
                } else {
                    daysPeople.set(day, 1)
                }
            });
        })
    });
    return daysPeople;
}

/*
Input:
    Map {
        'Tuesday' => 2,
        'Friday' => 2,
        'Monday' => 2,
        'Sunday' => 2,
        'Wednesday' => 2,
        'Saturday' => 3 
    }
    Output: 
        string
*/
function getMostPopularDay(daysPeople) {
    let output = { bestDayInfo: {} };
    daysPeople.forEach((people, day) => {
        const currentBestNumber = output.bestDayInfo.numberOfPeople;
        if (currentBestNumber === undefined || currentBestNumber && currentBestNumber < people) {
            output.bestDayInfo.day = day;
            output.bestDayInfo.numberOfPeople = people
        } 
    });

    return output.bestDayInfo.day;
}


dataGetter().then(shows => {
    console.log("daysWithAverageRating: ", getDaysWithAverageRating(getDaysWithRatings(shows)));
    const bestDaysForEachPerson = getDaysFor(people, shows);
    console.log("bestDaysForEachPerson: ", bestDaysForEachPerson);
    console.log("people on TV at: ", mostPeopleNearTV(bestDaysForEachPerson))
});
