let fetch = require("isomorphic-fetch");

//no longer used (alternative to Promise.all)
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


/* 
Input:
    Map {
        'Thursday' => [ 6.5, 7.8 ],
        ....
    }
Ouput:
    Map {
        'Thursday' => 7.375000000000009,
        'Tuesday' => 7.370083682008374,
    }
 */  
function calculateAverageRatings(mapWithRatings) {
    let mapWithAverageRating = new Map();
    mapWithRatings.forEach((ratings, day) => {
        mapWithAverageRating.set(day, getAverage(ratings));
    });
    return mapWithAverageRating;
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
    "Maksim": ["Comedy", "Supernatural", "Mystery", "Science-Fiction", "Action", "Fantasy", "Adventure", "Anime", "DIY"],
    "Viktorija": ["Comedy", "Adventure", "Food", "Drama", "Action"]
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
                // uncomment to see days
                goodDays: goodDays, //JSON.stringify(Array.from(goodDays)),
                badDays: badDays, //JSON.stringify(Array.from(badDays)),
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

function getGenresWithRatings(shows) {
    let output = new Map();
    shows.forEach(show => {
        const rating = show.rating.average;
        if (rating !== null) {
            const genres = show.genres;
            genres.forEach(genre => {
                let ratings = output.get(genre);
                if (ratings) {
                    output.set(genre, ratings.concat(rating));
                } else {
                    output.set(genre, [rating]);
                }
            })
        }
    })
    return calculateAverageRatings(output);
}

/*
Input:
    Map {
        'Drama' => 7.941515151515148,
        'Science-Fiction' => 7.873333333333331
    }
Ouput:
    [
        [genre, rating],
        ...
    ]
*/
function sortByRating(genresWithRatings) {
    return Array.from(genresWithRatings).sort((a, b) => {
        return a[1] - b[1];
    });
}

function getPromises() {
    let promises = [];
    for (let i = 0; i <= 200; i++) {
        promises.push((fetch('http://api.tvmaze.com/shows?page=' + i).then(data => data.json())))
    }
    return promises;
}

Promise.all(getPromises())
    .then((data) => {
        let shows = [];
        data.forEach(pageData => {
            shows.push(...pageData)
        });
        return shows;
    }).then(shows => {
        const daysWithRatings = getDaysWithRatings(shows);
        console.log("Days with average film ratings: ", calculateAverageRatings(daysWithRatings));
    
        const bestDaysForEachPerson = getDaysFor(people, shows);
        console.log("Best day to watch TV for each person: ", bestDaysForEachPerson);
        console.log("Most people should be watching TV on: ", mostPeopleNearTV(bestDaysForEachPerson));
    
        const genresWithRatings = getGenresWithRatings(shows);
        console.log("Genres sorted by rating", sortByRating(genresWithRatings));
        const genresSortedByRating = sortByRating(genresWithRatings)
        console.log("5 categories with worst ratings: ", genresSortedByRating.slice(0,5))
        console.log("5 categories with best ratings: ", genresSortedByRating.slice(-5))
    });
