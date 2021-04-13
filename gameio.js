CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
}

function imgFromSource(source) {
    let elem = new Image();
    elem.src = source;
    return elem;
}

async function fetchUrlReturnJson(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (e) {
        return undefined;
    }
}

const
    TURRET_DEFAULT = 0, TURRET_SHOTGUN = 1, TURRET_SNIPER = 2,
    TURRET_MACHINEGUN = 3, TURRET_HUNTER = 4, TURRET_SPRAYER = 5,
    TURRET_DESTROYER = 6, TURRET_CANNONEER = 7, TURRET_BOMBER = 8,
    TURRET_MINIGUN = 9;

function turretSwitch(type) {
    let turretImg = new Image();
    switch (type) {
        case TURRET_DEFAULT:
            turretImg.src = `./client/images/cannons/default.png`;
            break;
        case TURRET_SHOTGUN:
            turretImg.src = `./client/images/cannons/shotgun.png`;
            break;
        case TURRET_SNIPER:
            turretImg.src = `./client/images/cannons/sniper.png`;
            break;
        case TURRET_MACHINEGUN:
            turretImg.src = `./client/images/cannons/machinegun.png`;
            break;
        case TURRET_HUNTER:
            turretImg.src = `./client/images/cannons/hunter.png`;
            break;
        case TURRET_SPRAYER:
            turretImg.src = `./client/images/cannons/sprayer.png`;
            break;
        case TURRET_DESTROYER:
            turretImg.src = `./client/images/cannons/destroyer.png`;
            break;
        case TURRET_CANNONEER:
            turretImg.src = `./client/images/cannons/cannoneer.png`;
            break;
        case TURRET_BOMBER:
            turretImg.src = `./client/images/cannons/bomber.png`;
            break;
        case TURRET_MINIGUN:
            turretImg.src = `./client/images/cannons/minigun.png`;
            break;

    }
    return turretImg;
}

function colorLuminance(hex, lum) {
    // Validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, "");
    if (hex.length < 6) {
        hex = hex.replace(/(.)/g, '$1$1');
    }
    lum = lum || 0;
    // Convert to decimal and change luminosity
    var rgb = "#",
        c;
    for (var i = 0; i < 3; ++i) {
        c = parseInt(hex.substr(i * 2, 2), 16);
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgb += ("00" + c).substr(c.length);
    }
    return rgb;
}

function normalizeCoords(c, canvasPos, ratio, canvasDimen) {
    return c + (-canvasPos / ratio + canvasDimen / 2);
}

const smoothing = 0.04;

let themes = [
    {
        edgeColor: '#069950',
        backgroundColor: '#17A456',
        minimapColor1: '#1D5737',
        minimapColor2: '#124D28'
    },
    {
        edgeColor: '#e0e0e0',
        backgroundColor: '#ebebeb',
        minimapColor1: '#adadad',
        minimapColor2: '#c4c4c4'
    },
    {
        edgeColor: '#0fa10c',
        backgroundColor: '#10af0d',
        minimapColor1: '#064005',
        minimapColor2: '#095907'
    }
];

var fps = { startTime: 0, frameNumber: 0, getFPS: function () { this.frameNumber++; var d = new Date().getTime(), currentTime = (d - this.startTime) / 1000, result = Math.floor((this.frameNumber / currentTime)); if (currentTime > 1) { this.startTime = new Date().getTime(); this.frameNumber = 0; } return result; } };
let perf = false;
function gameIO() {
    // Rendering Portion
    var game = {
        renderers: [],
        scenes: [],
        particles: [],
        envs: {},
        leaderboard: [],
        serverStats: [],
        pingArray: [],
        pingValues: [],
        fpsValues: [],
        servers: [],
        totalTime: undefined
    };
    game.addServer = async function (ip, display, reg, customPort) {
        let serverSelector = document.getElementById('serverSelect');

        let players = "...";
        let webprotocol = reg === 'TESTREGION' ? 'http' : 'https';
        let wsprotocol = reg === 'TESTREGION' ? 'ws' : 'wss';
        let port = customPort || (reg === 'TESTREGION' ? '80' : '443');
        this.servers.push(`${wsprotocol}:${ip}:${port}/ws`);

        if (this.servers.length === 0) {
            let optgroup = document.createElement('optgroup');
            optgroup.label = reg;
            let option = document.createElement('option');

            let jsonUrl = `${webprotocol}://${ip}:${port}/playerCount`;
            let jsonObj = await fetchUrlReturnJson(jsonUrl);
            if (jsonObj !== undefined) players = jsonObj.players;

            option.innerHTML = `${display} [${players} players]`;
            optgroup.appendChild(option);
            serverSelector.add(optgroup);
            return;
        } else {
            var optgroups = [...serverSelector.getElementsByTagName('optgroup')];
            let foundIndex = optgroups.findIndex(e => e.label === reg);
            if (foundIndex >= 0) {
                let option = document.createElement('option');

                let jsonUrl = `${webprotocol}://${ip}:${port}/playerCount`;
                let jsonObj = await fetchUrlReturnJson(jsonUrl);
                if (jsonObj !== undefined) players = jsonObj.players;

                option.innerHTML = `${display} [${players} players]`;
                optgroups[foundIndex].appendChild(option);
            } else {
                let optgroup = document.createElement('optgroup');
                optgroup.label = reg;
                serverSelector.add(optgroup);
                let option = document.createElement('option');

                let jsonUrl = `${webprotocol}://${ip}:${port}/playerCount`;
                let jsonObj = await fetchUrlReturnJson(jsonUrl);
                if (jsonObj !== undefined) players = jsonObj.players;

                option.innerHTML = `${display} [${players} players]`;
                optgroup.appendChild(option);
            }
        }
    }
    game.gameScale = 1;
    game.gamepad = function () {
        var gamepads = [];
        if (navigator.getGamepads !== undefined)
            gamepads = navigator.getGamepads();
        for (var i = 0; i < gamepads.length; i++) {
            if (gamepads[i] !== undefined)
                return gamepads[i];
        }
        return null;
    }
    game.gamepadControl = function () {
        var gamepad = {
            buttons: [],
            axes: []
        };
        for (var i = 0; i < 16; i++)
            gamepad.buttons.push({
                pressed: false
            });
        return gamepad;
    }
    game.mouse = function (renderer) {
        var mouse = new game.Vector2(0, 0);
        mouse.renderer = renderer || undefined;
        mouse.clicking = false;
        mouse.rightClicking = false;
        mouse.changed = false;
        mouse.rightChanged = true;
        mouse.moved = false;
        mouse.locked = false;
        mouse.client = new game.Vector2(0, 0);
        window.addEventListener("mousemove", function (event) {
            if (mouse.locked) {
                mouse.client.x += event.movementX;
                mouse.client.y += event.movementY;
                mouse.client.x = Math.max(Math.min(mouse.client.x, window.innerWidth), 0);
                mouse.client.y = Math.max(Math.min(mouse.client.y, window.innerHeight), 0);
                mouse.x = mouse.client.x;
                mouse.y = mouse.client.y;
            } else {
                mouse.x = event.clientX;
                mouse.y = event.clientY;
                mouse.client.x = mouse.x;
                mouse.client.y = mouse.y;
                for (const key in game.renderers[0].UI.buttons) {
                    game.renderers[0].UI.buttons[key].forEach(button => {
                        button.hovered = button.isPointInside({ x: mouse.x, y: mouse.y });
                    });
                }
            }
            mouse.angle = Math.atan2(mouse.client.y - window.innerHeight / 2, mouse.client.x - window.innerWidth / 2);
            mouse.angle += Math.PI;
            mouse.moved = true;
        });
        window.addEventListener("mousedown", function (event) {
            if (event.button === 0) {
                let send = true;
                for (const key in game.renderers[0].UI.buttons) {
                    game.renderers[0].UI.buttons[key].forEach(button => {
                        if (!button.enabled) return;
                        if (button.isPointInside({ x: mouse.x, y: mouse.y })) {
                            button.onclick();
                            button.pressed = true;
                            send = false;
                        }
                    });
                }
                if (send) {
                    mouse.changed = true;
                    mouse.clicking = true;
                }
            }
            else if (event.button == 2) {
                mouse.rightClicking = true
                mouse.rightChanged = true;
            }
            else if (event.button > 2) {
                event.preventDefault();
            }
        });
        window.addEventListener("click", function (event) {
            if (event.button > 2) {
                event.preventDefault();
            }
        });
        window.addEventListener("contextmenu", function (event) {
            event.preventDefault();
            if (event.stopPropagation != undefined)
                event.stopPropagation();
        });
        window.addEventListener("mouseup", function (event) {
            if (event.button === 0) {
                for (const key in game.renderers[0].UI.buttons) {
                    game.renderers[0].UI.buttons[key].forEach(button => {
                        if (button.pressed === true) { button.pressed = false }
                    });
                }
                mouse.clicking = false;
                mouse.changed = true;
            }
            else if (event.button == 2) {
                mouse.rightClicking = false;
                mouse.rightChanged = true;
            }
            else if (event.button > 2) {
                // This one works
                event.preventDefault();
            }
        });
        mouse.fromRenderer = function (renderer) {
            this.x = (this.x - renderer.c.width / 2 - renderer.left) * renderer.ratio / 2;
            this.y = (this.y - renderer.c.height / 2 - renderer.top) * renderer.ratio / 2;
        }
        mouse.isCollidingWithRectangle = function (rectangle) {
            if (renderer === undefined)
                return false;
            if (this.x < rectangle.position.x + rectangle.width / 2 &&
                this.x > rectangle.position.x - rectangle.width / 2 &&
                this.y < rectangle.position.y + rectangle.height / 2 &&
                this.y > rectangle.position.y - rectangle.height / 2)
                return true;
            return false;
        }
        return mouse;
    };
    game.touch = function () {
        var touches = [];
        window.addEventListener("touchmove", function (event) {
            event.preventDefault();
            while (event.targetTouches.length > touches.length)
                touches.push(new game.Vector2(0, 0));
            while (event.targetTouches.length < touches.length)
                touches.splice(0, 1);
            for (var i = 0; i < event.targetTouches.length; i++) {
                touches[i].x = event.targetTouches[i].pageX;
                touches[i].y = event.targetTouches[i].pageY;
            }
        });
        window.addEventListener("touchend", function (event) {
            while (event.targetTouches.length < touches.length)
                touches.splice(0, 1);
        });
        window.addEventListener("touchstart", function (event) {
            event.preventDefault();
            for (var i = 0; i < event.targetTouches.length; i++) {
                if ((event.targetTouches[i].pageX - game.renderers[0].c.width / 2 - game.renderers[0].left) * game.renderers[0].ratio / 2 > 0) {
                    controls.key_w = true;
                }
            }
        });
        return touches;
    }
    game.renderer = function (canvas) {
        if (canvas === undefined) {
            canvas = document.getElementById('canvas');
            canvas.style.position = "absolute";
            document.body.style.margin = "0";
            document.body.style.padding = "0";
            document.body.style.overflow = "hidden";
        }
        game.renderers.push({
            ctx: canvas.getContext('2d'),
            c: canvas,
            clearScreen: true,
            top: 0,
            left: 0,
            theme: 0,
            leftOfScreen: 0,
            rightOfScreen: 0,
            topOfScreen: 0,
            bottomOfScreen: 0,
            position: new game.Vector2(0, 0),
            ratio: 1,
            qualitySize: 1,
            smoothingEnabled: true,
            onDeathScreen: false,
            UI: {
                buttons: {
                    tankButton: [],
                    turretButton: [],
                },
                labels: [],
                render: function (ctx, ratio) {
                    for (const key in game.renderers[0].UI.buttons) {
                        if (key === "tankButton" && game.me.hasBodyUpgrade === false) continue;
                        if (key === "turretButton" && game.me.hasTurretUpgrade === false) continue;
                        game.renderers[0].UI.buttons[key].forEach(button => {
                            button.render(ctx, ratio, 1);
                        });
                    }
                    this.labels.forEach(label => {
                        label.render(ctx, ratio, 1);
                    });
                },
                getButtonById: function (id) {
                    for (const key in this.buttons) {
                        for (var i = 0; i < this.buttons[key].length; i++) {
                            if (this.buttons[key][i].buttonId == id) {
                                return this.buttons[key][i];
                            }
                        }
                    }
                    return null;
                },
                getLabelById: function (id) {
                    for (var i = 0; i < this.labels.length; i++) {
                        if (this.labels[i].textId == id) {
                            return this.labels[i];
                        }
                    }
                    return null;
                }
            },
            addButton: function (button) {
                let type = button.buttonId.split(":")[0];
                this.UI.buttons[type].push(button);
            },
            addLabel: function (label) {
                this.UI.labels.push(label);
            },
            render: function (scene) {
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                if (this.clearScreen)
                    this.clear();
                this.ctx.translate(-this.position.x / this.ratio + this.c.width / 2, -this.position.y / this.ratio + this.c.height / 2);
                scene.render(this.ctx, this.ratio * scene.camera.ratio, 1); //! scene render called here
            },
            clear: function () {
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                this.ctx.clearRect(0, 0, this.c.width, this.c.height);
            },
            drawEdge: function () {
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                this.ctx.fillStyle = themes[this.theme].edgeColor;
                this.ctx.globalAlpha = 1;
                this.ctx.fillRect(0, 0, this.c.width, this.c.height);
            },
            drawBackground: function () {
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                this.ctx.fillStyle = themes[this.theme].backgroundColor;
                this.ctx.globalAlpha = 1;
                this.ctx.fillRect(this.c.width / 2 - game.me.visual.position.x / this.ratio, this.c.height / 2 - game.me.visual.position.y / this.ratio, 2000 * game.gameScale / this.ratio / game.me.fov, 2000 * game.gameScale / this.ratio / game.me.fov);
            },
            drawMinimap: function () {
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                this.ctx.globalAlpha = 0.5;

                this.ctx.fillStyle = themes[this.theme].minimapColor1;
                this.ctx.fillRect(
                    normalizeCoords(window.innerWidth / 2 - 250 / this.ratio, this.position.x, this.ratio, this.c.width),
                    normalizeCoords(window.innerHeight / 2 - 250 / this.ratio, this.position.x, this.ratio, this.c.height),
                    220 / this.ratio,
                    220 / this.ratio
                );

                this.ctx.fillStyle = themes[this.theme].minimapColor2;
                this.ctx.fillRect(
                    normalizeCoords(window.innerWidth / 2 - 240 / this.ratio, this.position.x, this.ratio, this.c.width),
                    normalizeCoords(window.innerHeight / 2 - 240 / this.ratio, this.position.x, this.ratio, this.c.height),
                    200 / this.ratio,
                    200 / this.ratio
                );

                this.ctx.globalAlpha = 1;

                this.ctx.beginPath();
                this.ctx.fillStyle = "#fff";
                this.ctx.arc(
                    normalizeCoords((window.innerWidth / 2 - 235 / this.ratio) + game.me.visual.position.x * game.me.fov / ((10 + 0.5 * this.ratio) * game.gameScale) / this.ratio, this.position.x, this.ratio, this.c.width),
                    normalizeCoords((window.innerHeight / 2 - 235 / this.ratio) + game.me.visual.position.y * game.me.fov / ((10 + 0.5 * this.ratio) * game.gameScale) / this.ratio, this.position.y, this.ratio, this.c.height),
                    5 / this.ratio, 0, 2 * Math.PI
                );
                this.ctx.fill();

                // drawing global objects
                if (game.globalObjects === undefined) return;
                game.globalObjects.forEach(obj => {
                    if (!obj) return;
                    this.ctx.beginPath();
                    this.ctx.fillStyle = "#000";
                    this.ctx.arc(
                        normalizeCoords((window.innerWidth / 2 - 235 / this.ratio) + obj.pos.x * game.me.fov / ((10 + 0.5 * this.ratio) * game.gameScale) / this.ratio, this.position.x, this.ratio, this.c.width),
                        normalizeCoords((window.innerHeight / 2 - 235 / this.ratio) + obj.pos.y * game.me.fov / ((10 + 0.5 * this.ratio) * game.gameScale) / this.ratio, this.position.y, this.ratio, this.c.height),
                        5 / this.ratio, 0, 2 * Math.PI
                    );
                    this.ctx.fill();
                });

            },
            drawLeaderboard: function () {
                this.ctx.globalAlpha = 0.5;

                this.ctx.fillStyle = themes[this.theme].minimapColor1;
                this.ctx.fillRect(
                    normalizeCoords(-(window.innerWidth / 2 - 20 / this.ratio), this.position.x, this.ratio, this.c.width),
                    normalizeCoords(-(window.innerHeight / 2 - 20 / this.ratio), this.position.y, this.ratio, this.c.height),
                    300 / this.ratio,
                    230 / this.ratio
                );

                this.ctx.font = `${25 / this.ratio}px Montserrat`;

                let textWidth = this.ctx.measureText("Leaderboard");
                this.ctx.fillStyle = "#ffffff";
                this.ctx.fillText(
                    "Leaderboard",
                    normalizeCoords(-(window.innerWidth / 2 - 170 / this.ratio + textWidth.width / 2), this.position.x, this.ratio, this.c.width),
                    normalizeCoords(-(window.innerHeight / 2 - 55 / this.ratio), this.position.y, this.ratio, this.c.height)
                );

                this.ctx.font = `${17 / this.ratio}px Montserrat`;

                game.leaderboard.forEach((info, i) => {
                    const text = `${info.name}: ${info.xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
                    textWidth = this.ctx.measureText(text);
                    this.ctx.fillText(
                        text,
                        normalizeCoords(-(window.innerWidth / 2 - 170 / this.ratio + textWidth.width / 2), this.position.x, this.ratio, this.c.width),
                        normalizeCoords(-(window.innerHeight / 2 - (55 + 35 * (i + 1)) / this.ratio), this.position.y, this.ratio, this.c.height)
                    );
                });

                this.ctx.globalAlpha = 1;
            },
            drawGrid: function () {
                this.ctx.strokeStyle = "#000000";
                this.ctx.globalAlpha = 0.05;
                this.ctx.lineWidth = 4 / this.ratio / game.me.fov;
                let gridSpace = 100 / this.ratio / game.me.fov;
                let gridSetter;

                gridSetter = (this.c.width / 2 - game.me.visual.position.x / this.ratio % gridSpace) % gridSpace - 0 / this.ratio;
                while (gridSetter <= this.c.width) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(gridSetter, 0);
                    this.ctx.lineTo(gridSetter, this.c.height);
                    this.ctx.stroke();
                    gridSetter += gridSpace;
                }

                gridSetter = (this.c.height / 2 - game.me.visual.position.y / this.ratio % gridSpace) % gridSpace - 0 / this.ratio;
                while (gridSetter <= this.c.height) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, gridSetter);
                    this.ctx.lineTo(this.c.width, gridSetter);
                    this.ctx.stroke();
                    gridSetter += gridSpace;
                }
                this.ctx.globalAlpha = 1;
            },
            drawPerformance: function () {
                if (!perf) return;
                this.ctx.globalAlpha = 0.5;
                this.ctx.fillStyle = `${35 / this.ratio}px Montserrat`;
                this.ctx.fillText(
                    "Avg / Min / Max",
                    normalizeCoords(window.innerWidth / 2 - 200 / this.ratio, this.position.x, this.ratio, this.c.width),
                    normalizeCoords(-(window.innerHeight / 2 - 40 / this.ratio), this.position.y, this.ratio, this.c.height),
                );
                this.ctx.fillText(
                    `FPS: ${Math.round(game.fpsValues[0])} ${Math.round(game.fpsValues[1])} ${Math.round(game.fpsValues[2])}`,
                    normalizeCoords(window.innerWidth / 2 - 200 / this.ratio, this.position.x, this.ratio, this.c.width),
                    normalizeCoords(-(window.innerHeight / 2 - 70 / this.ratio), this.position.y, this.ratio, this.c.height),
                );
                this.ctx.fillText(
                    `TPS: ${Math.round(game.serverStats[0])} ${Math.round(game.serverStats[1])} ${Math.round(game.serverStats[2])}`,
                    normalizeCoords(window.innerWidth / 2 - 200 / this.ratio, this.position.x, this.ratio, this.c.width),
                    normalizeCoords(-(window.innerHeight / 2 - 100 / this.ratio), this.position.y, this.ratio, this.c.height),
                );
                this.ctx.fillText(
                    `Ping: ${Math.round(game.pingValues[0])} ${Math.round(game.pingValues[1])} ${Math.round(game.pingValues[2])}`,
                    normalizeCoords(window.innerWidth / 2 - 200 / this.ratio, this.position.x, this.ratio, this.c.width),
                    normalizeCoords(-(window.innerHeight / 2 - 130 / this.ratio), this.position.y, this.ratio, this.c.height),
                );
                this.ctx.globalAlpha = 1;
            }
        });
        game.renderers[game.renderers.length - 1].ctx.imageSmoothingEnabled = true;
        game.resize();
        game.resize();
        return game.renderers[game.renderers.length - 1];
    };
    game.socket = function (ip, onmessage, onopen, onclose, onerror) {
        if (ip === undefined)
            return null;
        var socket = new WebSocket(ip);
        socket.binaryType = "arraybuffer";
        socket.onmessage = onmessage || function () { };
        socket.onopen = onopen || function () { };
        socket.onclose = onclose || function () { };
        socket.onerror = onerror || function () { };
        return socket;
    };
    game.resize = function () {
        let a = game.renderers[0].UI.getLabelById("score");
        if (a) {
            game.renderers[0].UI.getLabelById("score").anchors.y = Math.max(1 + 0.5 - (window.innerHeight / 722 * 0.5), 1);
            game.renderers[0].UI.getLabelById("score_behind").anchors.y = Math.max(1 + 0.5 - (window.innerHeight / 722 * 0.5), 1);
            game.renderers[0].UI.getLabelById("level").anchors.y = Math.max(1 + 0.5 - (window.innerHeight / 722 * 0.5), 1);
            game.renderers[0].UI.getLabelById("level_behind").anchors.y = Math.max(1 + 0.5 - (window.innerHeight / 722 * 0.5), 1);
        }

        if (game.renderers[0].onDeathScreen) {
            game.update();
            game.renderers[0].clear();
            game.renderers[0].drawEdge();
            game.renderers[0].drawBackground();
            game.renderers[0].drawGrid();
            game.renderers[0].render(game.scenes[0]);
            game.renderers[0].drawMinimap();
            game.renderers[0].drawLeaderboard();
            game.renderers[0].UI.render(game.renderers[0].ctx, game.renderers[0].ratio);
            game.renderers[0].drawPerformance();

            const dc = document.getElementById("death-canvas");
            dc.width = window.innerWidth;
            dc.height = window.innerHeight;
            const deathCanvas = dc.getContext("2d");

            deathCanvas.clearRect(0, 0, window.innerWidth, window.innerHeight);
            const oldImg = game.renderers[0].ctx.getImageData(
                normalizeCoords(-window.innerWidth / 2, game.renderers[0].position.x, game.renderers[0].ratio, game.renderers[0].c.width),
                normalizeCoords(-window.innerHeight / 2, game.renderers[0].position.y, game.renderers[0].ratio, game.renderers[0].c.height),
                window.innerWidth, window.innerHeight
            );
            deathCanvas.putImageData(oldImg, 0, 0);

            deathCanvas.globalAlpha = 0.5;
            deathCanvas.fillStyle = "#000000";
            deathCanvas.fillRect(0, 0, window.innerWidth, window.innerHeight);
            deathCanvas.globalAlpha = 1;

            deathCanvas.font = "30px Montserrat";
            deathCanvas.fillStyle = "#ffffff";
            let width = deathCanvas.measureText("You died : (").width;
            deathCanvas.fillText("You died : (", window.innerWidth / 2 - width / 2, window.innerHeight * 1 / 6);
            width = deathCanvas.measureText(game.totalTime).width;
            deathCanvas.fillText(game.totalTime, window.innerWidth / 2 - width / 2, window.innerHeight * 2 / 6);
        }

        var renderSize = 1;
        game.renderers.forEach(function (renderer) {
            renderSize = renderer.qualitySize;
            if (document.body.clientWidth / renderer.c.width <= document.body.clientHeight / renderer.c.height) {
                renderer.c.height = document.body.clientHeight;
                renderer.c.width = renderer.c.height * 16 / 9;
                renderer.ratio = 1080 / renderer.c.height;
                renderer.c.style.height = "100%";
                renderer.c.style.width = document.body.clientHeight / renderer.c.height * renderer.c.width + 2;
                renderer.c.style.top = "0";
                renderer.top = 0;
                renderer.c.style.left = document.body.clientWidth / 2 - (document.body.clientHeight / renderer.c.height * renderer.c.width) / 2 - 1 + "px";
                renderer.left = document.body.clientWidth / 2 - (document.body.clientHeight / renderer.c.height * renderer.c.width) / 2 - 1;
            } else {
                renderer.c.width = document.body.clientWidth;
                renderer.c.height = renderer.c.width * 9 / 16;
                renderer.ratio = 1920 / renderer.c.width;
                renderer.c.style.width = "100%";
                renderer.c.style.height = document.body.clientWidth / renderer.c.width * renderer.c.height;
                renderer.c.style.left = "0";
                renderer.left = 0;
                renderer.c.style.top = document.body.clientHeight / 2 - (document.body.clientWidth / renderer.c.width * renderer.c.height) / 2 + "px";
                renderer.top = document.body.clientHeight / 2 - (document.body.clientWidth / renderer.c.width * renderer.c.height) / 2;
            }
            renderer.leftOfScreen = -1920 / 2 - ((document.body.clientWidth - renderer.c.width) / 2 * renderer.ratio);
            renderer.topOfScreen = -1080 / 2 - ((document.body.clientHeight - renderer.c.height) / 2 * renderer.ratio);
            renderer.rightOfScreen = -renderer.leftOfScreen;
            renderer.bottomOfScreen = -renderer.topOfScreen;
            renderer.c.width /= renderSize;
            renderer.c.height /= renderSize;
            renderer.ratio *= renderSize;
            renderer.ctx.imageSmoothingEnabled = renderer.smoothingEnabled;
        });
        document.getElementById("return").style.marginTop = window.innerHeight * 17 / 32;
    };
    window.addEventListener('resize', game.resize, false);
    game.object = function () {
        return {
            position: new game.Vector2(0, 0),
            size: 1,
            opacity: 1,
            rotation: 0,
            type: "object",
            background: false,
            parent: null,
            objects: [],
            belowObjects: [],
            add: function (object, drawLayer, scale) {
                if (object.parent != null) {
                    console.log("You can only have 1 parent per object");
                    console.log(object);
                    return;
                }
                object.drawLayer = drawLayer ? drawLayer : 1;
                object.scale = scale ? scale : 1;
                object.parent = this;
                this.objects.push(object);
            },
            addBelow: function (object) {
                if (object.parent != null) {
                    console.log("You can only have 1 parent per object");
                    return;
                }
                object.parent = this;
                this.belowObjects.unshift(object);
            },
            remove: function (object) {
                while (this.objects.indexOf(object) != -1) {
                    this.objects.splice(this.objects.indexOf(object), 1);
                    object.parent = null;
                }
                while (this.belowObjects.indexOf(object) != -1) {
                    this.belowObjects.splice(this.belowObjects.indexOf(object), 1);
                    object.parent = null;
                }
            },
            render: function (ctx, ratio, opacity) {
                opacity = Math.min(Math.max(0, opacity), 1);
                var size = this.size
                opacity = Math.min(this.opacity * opacity, 1);
                if (opacity <= 0)
                    return;

                ctx.translate(this.position.x / ratio, this.position.y / ratio);
                ctx.rotate(this.rotation);
                this.belowObjects.forEach(function (object) {
                    object.render(ctx, ratio / size, opacity);
                });
                ctx.globalAlpha = opacity;
                this.renderSpecific(ctx, ratio / this.size);

                this.objects.forEach(function (object) {
                    object.render(ctx, ratio / size, opacity);
                });

                ctx.rotate(-this.rotation);
                ctx.translate(-this.position.x / ratio, -this.position.y / ratio);
            },
            renderSpecific: function (ctx, ratio) {
                return;
            }
        }
    }
    game.image = function (image, x, y, width, height, opacity, offsetX, offsetY, dontScale) {
        var element = new game.object();
        element.image = image || null;
        element.position = new game.Vector2(x || 0, y || 0);
        element.width = width || 100;
        element.height = height || 100;
        element.offsetX = offsetX || 0;
        element.offsetY = offsetY || 0;
        element.opacity = opacity || 1;
        element.type = "image";
        element.dontScale = dontScale;
        element.renderSpecific = function (ctx, ratio) {
            const w = this.dontScale ? this.width : this.width / game.me.fov;
            const h = this.dontScale ? this.width : this.height / game.me.fov;
            try {
                ctx.rotate(Math.PI / 2);
                ctx.drawImage(this.image, ((-w / 2) + this.offsetX) / ratio, ((-h / 2) + this.offsetY) / ratio, w / ratio, h / ratio);
                ctx.rotate(-Math.PI / 2);
            } catch (e) {
            }
        }
        return element;
    }
    /* //* Old Text Methods
    game.fillText = function (text, x, y, fillStyle, font, fontSize, otherParams, opacity, align) {
      var element = new game.object();
      element.text = text || "";
      element.position = new game.Vector2(x || 0, y || 0);
      element.fillStyle = fillStyle || "#000";
      element.font = font || "Arial";
      element.fontSize = fontSize || 30;
      element.otherParams = otherParams || "";
      element.opacity = opacity || 1;
      element.type = "text";
      element.width = 0;
      element.align = align || "center";
      element.renderSpecific = function (ctx, ratio) {
        ctx.font = this.otherParams + " " + this.fontSize / ratio + "px " + this.font;
        var width = ctx.measureText(this.text).width;
        let biggest = ctx.measureText("WWWWWWWWWWWWWWWWWWWWWWWWWWp");
        element.width = width * ratio;
        ctx.fillStyle = this.fillStyle;
        if (width > biggest.width) this.text = "spammy name";
        switch (element.align) {
          case "right":
            ctx.fillText(this.text, Math.floor(-width), this.fontSize / 3 / ratio);
            break;
          case "left":
            ctx.fillText(this.text, 0, this.fontSize / 3 / ratio);
            break;
          default:
            ctx.fillText(this.text, Math.floor(-width / 2), this.fontSize / 3 / ratio);
            break;
        }
      }
      return element;
    }
    game.strokeText = function (text, x, y, strokeStyle, font, fontSize, otherParams, opacity, align) {
      var element = new game.object();
      element.text = text || "";
      element.position = new game.Vector2(x || 0, y || 0);
      element.strokeStyle = strokeStyle || "#000";
      element.font = font || "Arial";
      element.fontSize = fontSize || 30;
      element.otherParams = otherParams || "";
      element.opacity = opacity || 1;
      element.type = "text";
      element.width = 0;
      element.align = align || "center";
      element.lineWidth = 2;
      element.renderSpecific = function (ctx, ratio) {
        ctx.miterLimit = 0.1;
        ctx.font = this.otherParams + " " + this.fontSize / ratio + "px " + this.font;
        var width = ctx.measureText(this.text).width;
        element.width = width * ratio;
        ctx.strokeStyle = this.strokeStyle;
        ctx.lineWidth = this.lineWidth * this.size / ratio;
        switch (element.align) {
          case "right":
            ctx.strokeText(this.text, Math.floor(-width), this.fontSize / 3 / ratio);
            break;
          case "left":
            ctx.strokeText(this.text, 0, this.fontSize / 3 / ratio);
            break;
          default:
            ctx.strokeText(this.text, Math.floor(-width / 2), this.fontSize / 3 / ratio);
            break;
        }
      }
      return element;
    }
    */
    game.text = function (text, x, y, fillStyle, strokeStyle, font, fontSize, align, otherParams, opacity) {
        var element = new game.object();
        element.text = text || "";
        element.position = new game.Vector2(x || 0, y || 0);
        let stroke = false, fill = false;
        if (fillStyle) fill = true;
        if (strokeStyle) stroke = true;
        element.strokeStyle = strokeStyle || "#000";
        element.fillStyle = fillStyle || "#000";
        element.font = font || "Montserrat";
        element.fontSize = fontSize || 30;
        element.otherParams = otherParams || "";
        element.opacity = opacity || 1;
        element.type = "text";
        element.width = 0;
        element.align = align || "center";
        element.lineWidth = 2;
        element.renderSpecific = function (ctx, ratio) {
            ctx.font = this.otherParams + " " + this.fontSize / ratio + "px " + this.font;
            var width = ctx.measureText(this.text).width;
            let biggest = ctx.measureText("@").width * 20;
            element.width = width * ratio;
            ctx.fillStyle = this.fillStyle;
            ctx.strokeStyle = this.strokeStyle;
            if (width > biggest) this.text = "spammy name";
            ctx.miterLimit = 0.1;
            element.width = width * ratio;
            ctx.lineWidth = this.lineWidth * this.size / ratio;
            switch (element.align) {
                case "right":
                    if (fill) ctx.fillText(this.text, Math.floor(-width), this.fontSize / 3 / ratio);
                    if (stroke) ctx.strokeText(this.text, Math.floor(-width), this.fontSize / 3 / ratio);
                    break;
                case "left":
                    if (fill) ctx.fillText(this.text, 0, this.fontSize / 3 / ratio);
                    if (stroke) ctx.strokeText(this.text, 0, this.fontSize / 3 / ratio);
                    break;
                default:
                    if (fill) ctx.fillText(this.text, Math.floor(-width / 2), this.fontSize / 3 / ratio);
                    if (stroke) ctx.strokeText(this.text, Math.floor(-width / 2), this.fontSize / 3 / ratio);
                    break;
            }
        }
        return element;
    }
    game.Vector2 = function (x, y) {
        return {
            x: x || 0,
            y: y || 0,
            clone: function () {
                return new game.Vector2(this.x, this.y);
            }
        };
    }

    game.button = function (id, anchors, x, y, width, height, radius, style, inside, onclick, opacity, batch) {
        var element = {};
        element.buttonId = id || null;
        element.anchors = anchors || { x: 2, y: 2 };
        element.enabled = true;
        element.hovered = false;
        element.pressed = false;
        element.width = width || 100;
        element.height = height || 100;
        element.radius = radius || 5;
        element.opacity = opacity || 1;
        element.style = style || { fill: { default: "#000" }, stroke: { default: 0, hover: 0, click: 0, lineWidth: 0 } };
        element.position = new game.Vector2(0, 0);
        element.offset = new game.Vector2(x || 0, y || 0);
        element.inside = inside || game.text("No Value", 0, 0, "#ddd", null, "Montserrat", 32); //@ {game.text}, {game.image}
        element.batch = batch || [];

        element.onclick = onclick || function () {
            console.log(`Button with ID: "${this.buttonId}" was pressed.`)
        }

        element.render = function (ctx, ratio, opacity) {
            this.ratio = ratio;
            opacity = Math.min(Math.max(0, opacity), 1);
            opacity = Math.min(this.opacity * opacity, 1);
            if (opacity <= 0) return;

            this.position.x = game.renderers[0].c.width / this.anchors.x - this.width / 2 / ratio + this.offset.x / ratio;
            this.position.y = game.renderers[0].c.height / this.anchors.y - this.height / 2 / ratio + this.offset.y / ratio;

            ctx.translate(this.position.x, this.position.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = opacity;

            ctx.roundRect(0, 0, this.width / ratio, this.height / ratio, this.radius / ratio);

            if (this.pressed) {
                if (this.style.fill.click) ctx.fillStyle = this.style.fill.click;
            } else {
                if (this.hovered) {
                    if (this.style.fill.hover) ctx.fillStyle = this.style.fill.hover;
                } else {
                    if (this.style.fill.default) ctx.fillStyle = this.style.fill.default;
                }
            }
            if (this.style.fill) ctx.fill();

            if (this.style.stroke) {
                if (this.pressed) {
                    if (this.style.stroke.click) ctx.strokeStyle = this.style.stroke.click;
                } else {
                    if (this.hovered) {
                        if (this.style.stroke.hover) ctx.strokeStyle = this.style.stroke.hover;
                    } else {
                        if (this.style.stroke.default) ctx.strokeStyle = this.style.stroke.default;
                    }
                }
                ctx.lineWidth = this.style.stroke.lineWidth / ratio;
                if (this.style.stroke) ctx.stroke();
            }

            ctx.rotate(-this.rotation);
            ctx.translate(-this.position.x, -this.position.y);

            this.batch.forEach(batchElement => {
                batchElement.position.x = game.renderers[0].c.width / this.anchors.x + this.offset.x / ratio;
                batchElement.position.y = game.renderers[0].c.height / this.anchors.y + this.offset.y / ratio;
                ctx.translate(batchElement.position.x, batchElement.position.y);
                ctx.rotate(batchElement.rotation);
                batchElement.renderSpecific(ctx, ratio);
                ctx.rotate(-batchElement.rotation);
                ctx.translate(-batchElement.position.x, -batchElement.position.y);
            });

            element.inside.position.x = game.renderers[0].c.width / this.anchors.x + this.offset.x / ratio;
            element.inside.position.y = game.renderers[0].c.height / this.anchors.y + this.offset.y / ratio;
            ctx.translate(element.inside.position.x, element.inside.position.y);
            ctx.rotate(element.inside.rotation);
            element.inside.renderSpecific(ctx, ratio);
            ctx.rotate(-element.inside.rotation);
            ctx.translate(-element.inside.position.x, -element.inside.position.y);
        }

        element.isPointInside = function (point) {
            const relativeX = (this.position.x - normalizeCoords(0, game.renderers[0].position.x, this.ratio, game.renderers[0].c.width)) * this.ratio;
            const relativeY = (this.position.y - normalizeCoords(0, game.renderers[0].position.y, this.ratio, game.renderers[0].c.height)) * this.ratio;

            point.x -= window.innerWidth / 2;
            point.y -= window.innerHeight / 2;

            point.x *= this.ratio;
            point.y *= this.ratio;

            return (point.x > relativeX && point.x < relativeX + this.width) && (point.y > relativeY && point.y < relativeY + this.height);
        }

        element.setOtherColors = function (setStroke, defaultColor) {
            if (defaultColor) {
                this.style.fill.default = defaultColor;
                this.style.fill.hover = colorLuminance(this.style.fill.default, -(6 * 0.01));
                this.style.fill.click = colorLuminance(this.style.fill.default, -(12 * 0.01));

                if (setStroke) this.style.stroke.default = colorLuminance(this.style.fill.default, -(10 * 0.01));

                this.style.stroke.hover = colorLuminance(this.style.stroke.default, -(6 * 0.01));
                this.style.stroke.click = colorLuminance(this.style.stroke.default, -(12 * 0.01));
            } else {
                this.style.fill.hover = this.style.fill.hover || colorLuminance(this.style.fill.default, -(6 * 0.01));
                this.style.fill.click = this.style.fill.click || colorLuminance(this.style.fill.default, -(12 * 0.01));

                if (setStroke) this.style.stroke.default = colorLuminance(this.style.fill.default, -(10 * 0.01));

                this.style.stroke.hover = this.style.stroke.hover || colorLuminance(this.style.stroke.default, -(6 * 0.01));
                this.style.stroke.click = this.style.stroke.click || colorLuminance(this.style.stroke.default, -(12 * 0.01));
            }
        }

        element.setOtherColors(true);
        return element;
    }

    game.label = function (id, anchors, x, y, width, height, radius, style, text) {
        var element = {};
        element.textId = id || null;
        element.anchors = anchors || { x: 2, y: 2 };
        element.width = width || 100;
        element.height = height || 100;
        element.radius = radius || 5;
        element.opacity = 1;
        element.style = style || { color: "#ae1919", stroke: null, lineWidth: 0 };
        element.position = new game.Vector2(0, 0);
        element.offset = new game.Vector2(x || 0, y || 0);
        element.text = text || game.text("No Value", 0, 0, "#ddd", null, "Montserrat", 32); //@ {game.text}, {game.image}

        element.render = function (ctx, ratio, opacity) {
            this.ratio = ratio;
            opacity = Math.min(Math.max(0, opacity), 1);
            opacity = Math.min(this.opacity * opacity, 1);
            if (opacity <= 0)
                return;

            this.position.x = game.renderers[0].c.width / this.anchors.x - this.width / 2 / ratio + this.offset.x / ratio;
            this.position.y = game.renderers[0].c.height / this.anchors.y - this.height / 2 / ratio + this.offset.y / ratio;
            ctx.translate(this.position.x, this.position.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = opacity;
            if (this.pressed) {
                if (this.style.clickColor) ctx.fillStyle = this.style.clickColor;
            } else {
                if (this.hovered) {
                    if (this.style.hoverColor) ctx.fillStyle = this.style.hoverColor;
                } else {
                    if (this.style.color) ctx.fillStyle = this.style.color;
                }
            }
            ctx.roundRect(0, 0, this.width / ratio, this.height / ratio, this.radius / ratio);
            if (this.style.color) ctx.fill();
            if (this.style.stroke) ctx.stroke();
            ctx.rotate(-this.rotation);
            ctx.translate(-this.position.x, -this.position.y);

            element.text.position.x = game.renderers[0].c.width / this.anchors.x + this.offset.x / ratio;
            element.text.position.y = game.renderers[0].c.height / this.anchors.y + this.offset.y / ratio;
            ctx.translate(element.text.position.x, element.text.position.y);
            element.text.renderSpecific(ctx, ratio);
            ctx.translate(-element.text.position.x, -element.text.position.y);
        }
        return element;
    }

    game.controls = function () {
        return {
            up: false,
            down: false,
            left: false,
            right: false,
            space: false,
            shift: false,
            changed: false,
            clone: function () {
                var a = new game.controls();
                a.up = this.up;
                a.down = this.down;
                a.left = this.left;
                a.right = this.right;
                a.space = this.space;
                a.shift = this.shift;
                return a;
            }
        };
    }
    game.multiplayerControls = function () {
        return {
            key_up: false,
            key_down: false,
            key_left: false,
            key_right: false,
            key_w: false,
            key_s: false,
            key_a: false,
            key_d: false,
            space: false,
            shift: false,
            changed: false
        };
    }
    game.keyboard = function (control) {

        control = control || new game.controls();
        control.changedKeys = [];

        function down(e) {
            let a = document.getElementById('commandInput');
            if (e.keyCode === 13) { // enter
                if (localStorage.branch) {
                    if (a.style.visibility === 'visible' && document.activeElement === a) {
                        GuDZKSKn(a.value);
                        a.style.visibility = 'hidden';
                        a.value = "";
                    } else {
                        a.value = "";
                        a.style.visibility = 'visible';
                        a.focus();
                    }
                }
            }
            if (a.style.visibility === 'visible' && document.activeElement === a) {
                return;
            }
            if (e.keyCode === 75) GuDZKSKn("k"); // k
            if (e.keyCode === 79) GuDZKSKn("die"); // o
            if (e.keyCode === 90) GuDZKSKn("z"); // z
            if (e.keyCode === 59) GuDZKSKn("chill"); // semicolon
            if (e.keyCode === 80) perf = !perf; // p
            var changed = false;
            if (e.keyCode == 37 || e.keyCode == 65) {
                if (!control.left) {
                    changed = true;
                    control.left = true;
                    control.changedKeys.push("left");
                }
            } else if (e.keyCode == 38 || e.keyCode == 87) {
                if (!control.up) {
                    changed = true;
                    control.up = true;
                    control.changedKeys.push("up");
                }
            } else if (e.keyCode == 39 || e.keyCode == 68) {
                if (!control.right) {
                    changed = true;
                    control.right = true;
                    control.changedKeys.push("right");
                }
            } else if (e.keyCode == 40 || e.keyCode == 83) {
                if (!control.down) {
                    changed = true;
                    control.down = true;
                    control.changedKeys.push("down");
                }
            } else if (e.keyCode == 32) {
                if (!control.space) {
                    changed = true;
                    control.space = true;
                    control.changedKeys.push("space");
                }
            } else if (e.keyCode == 16) {
                if (!control.shift) {
                    changed = true;
                    control.shift = true;
                    control.changedKeys.push("shift");
                }
            }
            control.changed = changed;
        }

        window.addEventListener('keydown', down, false);

        window.addEventListener("wheel", w => {
            if (w.deltaY) GuDZKSKn(`${w.deltaY > 0 ? "o" : "i"}`);
        });

        function up(e) {
            if (e.keyCode == 37 || e.keyCode == 65) {
                control.left = false;
                control.changedKeys.push("left");
            }
            else if (e.keyCode == 38 || e.keyCode == 87) {
                control.up = false;
                control.changedKeys.push("up");
            }
            else if (e.keyCode == 39 || e.keyCode == 68) {
                control.right = false;
                control.changedKeys.push("right");
            }
            else if (e.keyCode == 40 || e.keyCode == 83) {
                control.down = false;
                control.changedKeys.push("down");
            }
            else if (e.keyCode == 32) {
                control.space = false;
                control.changedKeys.push("space");
            }
            else if (e.keyCode == 16) {
                control.shift = false;
                control.changedKeys.push("shift");
            }
            control.changed = true;
        }

        window.addEventListener('keyup', up, false);

        return control;

    }
    game.multiplayerKeyboard = function (control) {

        control = control || new game.controls();

        function down(e) {
            var changed = false;
            if (e.keyCode == 65) {
                if (!control.key_a) {
                    changed = true;
                    control.key_a = true;
                }
            } else if (e.keyCode == 37) {
                if (!control.key_left) {
                    changed = true;
                    control.key_left = true;
                }
            } else if (e.keyCode == 87) {
                if (!control.key_w) {
                    changed = true;
                    control.key_w = true;
                }
            } else if (e.keyCode == 38) {
                if (!control.key_up) {
                    changed = true;
                    control.key_up = true;
                }
            } else if (e.keyCode == 68) {
                if (!control.key_d) {
                    changed = true;
                    control.key_d = true;
                }
            } else if (e.keyCode == 39) {
                if (!control.key_right) {
                    changed = true;
                    control.key_right = true;
                }
            } else if (e.keyCode == 83) {
                if (!control.key_s) {
                    changed = true;
                    control.key_s = true;
                }
            } else if (e.keyCode == 40) {
                if (!control.key_down) {
                    changed = true;
                    control.key_down = true;
                }
            } else if (e.keyCode == 32) {
                if (!control.space) {
                    changed = true;
                    control.space = true;
                }
            } else if (e.keyCode == 16) {
                if (!control.shift) {
                    changed = true;
                    control.shift = true;
                }
            }
            control.changed = changed;
        }

        window.addEventListener('keydown', down, false);

        function up(e) {
            if (e.keyCode == 37)
                control.key_left = false;
            else if (e.keyCode == 65)
                control.key_a = false;
            else if (e.keyCode == 38)
                control.key_up = false;
            else if (e.keyCode == 87)
                control.key_w = false;
            else if (e.keyCode == 39)
                control.key_right = false;
            else if (e.keyCode == 68)
                control.key_d = false;
            else if (e.keyCode == 40)
                control.key_down = false;
            else if (e.keyCode == 83)
                control.key_s = false;
            else if (e.keyCode == 32)
                control.space = false;
            else if (e.keyCode == 16)
                control.shift = false;
            control.changed = true;
        }

        window.addEventListener('keyup', up, false);

        return control;

    }
    game.rectangle = function (x, y, width, height, color, opacity) {
        var element = new game.object();
        element.position = new game.Vector2(x || 0, y || 0);
        element.width = width || 100;
        element.height = height || 100;
        element.color = color || "#000000";
        element.opacity = opacity || 1;
        element.type = "rectangle";
        element.renderSpecific = function (ctx, ratio) {
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.width * this.size / 2 / ratio, - this.height * this.size / 2 / ratio, this.width * this.size / ratio, this.height * this.size / ratio);
        }
        return element;
    }
    game.strokeRectangle = function (x, y, width, height, color, lineWidth, opacity) {
        var element = new game.object();
        element.position = new game.Vector2(x || 0, y || 0);
        element.width = width || 100;
        element.height = height || 100;
        element.color = color || "#000000";
        element.opacity = opacity || 1;
        element.lineWidth = lineWidth || 5;
        element.type = "rectangle";
        element.renderSpecific = function (ctx, ratio) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.lineWidth * this.size / ratio;
            ctx.strokeRect(-this.width * this.size / 2 / ratio, - this.height * this.size / 2 / ratio, this.width * this.size / ratio, this.height * this.size / ratio);
        }
        return element;
    }
    game.roundRectangle = function (x, y, width, height, radius, color, relative) {
        var element = new game.object();
        element.position = new game.Vector2(x || 0, y || 0);
        element.width = width || 100;
        element.height = height || 100;
        element.color = color || "#000000";
        element.radius = radius || 0;
        element.type = "roundRectangle";
        element.strokeStyle = -1;
        element.lineWidth = 4;
        element.relative = relative || false;
        element.renderSpecific = function (ctx, ratio) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            let path = new Path2D();
            path.moveTo((-this.width / 2 + this.radius) * this.size / ratio, -this.height * this.size / 2 / ratio);
            path.lineTo((this.width / 2 - this.radius) * this.size / ratio, -this.height * this.size / 2 / ratio);
            path.quadraticCurveTo(this.width * this.size / 2 / ratio, -this.height * this.size / 2 / ratio, this.width * this.size / 2 / ratio, (-this.height / 2 + this.radius) * this.size / ratio);
            path.lineTo(this.width * this.size / 2 / ratio, (this.height / 2 - this.radius) * this.size / ratio);
            path.quadraticCurveTo(this.width * this.size / 2 / ratio, this.height * this.size / 2 / ratio, (this.width / 2 - this.radius) * this.size / ratio, this.height * this.size / 2 / ratio);
            path.lineTo((-this.width / 2 + this.radius) * this.size / ratio, this.height * this.size / 2 / ratio);
            path.quadraticCurveTo(-this.width * this.size / 2 / ratio, this.height * this.size / 2 / ratio, -this.width * this.size / 2 / ratio, (this.height / 2 - this.radius) * this.size / ratio);
            path.lineTo(-this.width * this.size / 2 / ratio, (-this.height / 2 + this.radius) * this.size / ratio);
            path.quadraticCurveTo(-this.width * this.size / 2 / ratio, -this.height * this.size / 2 / ratio, (-this.width / 2 + this.radius) * this.size / ratio, -this.height * this.size / 2 / ratio);
            this.path = path;
            /*
            roundrect.moveTo((-this.width / 2 + this.radius) * this.size / ratio + this.position.x / ratio, -this.height * this.size / 2 / ratio + this.position.y / ratio);
            roundrect.lineTo((this.width / 2 - this.radius) * this.size / ratio + this.position.x / ratio, -this.height * this.size / 2 / ratio + this.position.y / ratio);
            roundrect.quadraticCurveTo(this.width * this.size / 2 / ratio + this.position.x / ratio, -this.height * this.size / 2 / ratio + this.position.y / ratio, this.width * this.size / 2 / ratio + this.position.x / ratio, (-this.height / 2 + this.radius) * this.size / ratio + this.position.y / ratio);
            roundrect.lineTo(this.width * this.size / 2 / ratio + this.position.x / ratio, (this.height / 2 - this.radius) * this.size / ratio + this.position.y / ratio);
            roundrect.quadraticCurveTo(this.width * this.size / 2 / ratio + this.position.x / ratio, this.height * this.size / 2 / ratio + this.position.y / ratio, (this.width / 2 - this.radius) * this.size / ratio + this.position.x / ratio, this.height * this.size / 2 / ratio + this.position.y / ratio);
            roundrect.lineTo((-this.width / 2 + this.radius + this.position.x / ratio) * this.size / ratio, this.height * this.size / 2 / ratio + this.position.y / ratio);
            roundrect.quadraticCurveTo(-this.width * this.size / 2 / ratio + this.position.x / ratio, this.height * this.size / 2 / ratio + this.position.y / ratio, -this.width * this.size / 2 / ratio + this.position.x / ratio, (this.height / 2 - this.radius) * this.size / ratio + this.position.y / ratio);
            roundrect.lineTo(-this.width * this.size / 2 / ratio + this.position.x / ratio, (-this.height / 2 + this.radius) * this.size / ratio + this.position.y / ratio);
            roundrect.quadraticCurveTo(-this.width * this.size / 2 / ratio + this.position.x / ratio, -this.height * this.size / 2 / ratio + this.position.y / ratio, (-this.width / 2 + this.radius) * this.size / ratio + this.position.x / ratio, -this.height * this.size / 2 / ratio + this.position.y / ratio);
            */
            //if (relative) game.renderers[0].ctx.translate(this.position.x, this.position.y);
            ctx.fill(this.path);
            //if (relative) ctx.translate(-(this.position.x / ratio - (game.renderers[0].c.width / 2) / ratio), -(this.position.y / ratio - (game.renderers[0].c.height / 2) / ratio));
        }
        return element;
    }
    game.polygon = function (x, y, points, color) {
        var element = new game.object();
        element.position = new game.Vector2(x || 0, y || 0);
        element.points = points || [
            new game.Vector2(-50, 40),
            new game.Vector2(0, -40),
            new game.Vector2(50, 40)]
        element.color = color || "#000000";
        element.shouldStroke = false;
        element.strokeColor = "#000000";
        element.lineWidth = 3;
        element.type = "polygon";
        element.renderSpecific = function (ctx, ratio) {
            var oldMiter = ctx.miterLimit;
            ctx.miterLimit = 10;
            ctx.fillStyle = this.color;
            ctx.lineWidth = this.lineWidth * this.size / ratio;
            ctx.beginPath();
            ctx.moveTo(this.points[0].x * this.size / ratio, this.points[0].y * this.size / ratio);
            for (var i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x * this.size / ratio, this.points[i].y * this.size / ratio);
            }
            ctx.closePath();
            if (this.shouldStroke) {
                ctx.strokeStyle = this.strokeColor;
                ctx.stroke();
            }
            ctx.fill();
            ctx.miterLimit = oldMiter;
        }
        return element;
    }
    game.circle = function (x, y, radius, color, opacity) {
        var element = new game.object();
        element.position = new game.Vector2(x || 0, y || 0);
        element.radius = radius || 100;
        element.color = color || "#000000";
        element.opacity = opacity || 1;
        element.type = "circle";
        element.renderSpecific = function (ctx, ratio) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * this.size / ratio, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
        }
        return element;
    }
    game.arc = function (x, y, radius, color, angle, rotation, lineWidth) {
        var element = new game.object();
        element.position = new game.Vector2(x || 0, y || 0);
        element.radius = radius || 100;
        element.color = color || "#000000";
        element.angle = angle || Math.PI;
        element.rotation = rotation || 0;
        element.lineWidth = lineWidth || 5;
        element.type = "arc";
        element.renderSpecific = function (ctx, ratio) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.lineWidth * this.size / ratio;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * this.size / ratio, 0, this.angle);
            ctx.stroke();
        }
        return element;
    }
    game.particle = function (x, y, size, color, turn, opacityFade, xVelocity, yVelocity, initialOpacity, velocityFade) {
        var obj = new game.rectangle(x, y, size, size, color, 0.7);
        obj.turn = turn || (Math.floor(Math.random() * 2) - 0.5) * 0.2;
        obj.opacityFade = opacityFade || 1;
        obj.rotation = Math.random() * Math.PI * 2;
        obj.velocity = new game.Vector2(xVelocity || 0, yVelocity || 0);
        obj.velocityFade = 1;
        if (velocityFade !== undefined)
            obj.velocityFade = velocityFade;
        obj.opacity = initialOpacity || 1;
        obj.type = "particle";
        obj.update = function (dt) {
            obj.rotation += obj.turn * dt;
            obj.width -= 0.2 * dt;
            obj.height -= 0.2 * dt;
            obj.opacity -= 0.02 * dt * obj.opacityFade;
            obj.velocity.x *= obj.velocityFade;
            obj.velocity.y *= obj.velocityFade;
            obj.position.x += obj.velocity.x * dt;
            obj.position.y += obj.velocity.y * dt;
            if (obj.opacity <= 0 && game.particles.indexOf(obj) != -1) {
                game.particles.splice(game.particles.indexOf(obj), 1);
                if (obj.parent != null)
                    obj.parent.remove(obj);
            }
        }
        game.particles.push(obj);
        return obj;
    }
    game.customParticle = function (obj, turn, opacityFade, xVelocity, yVelocity, widthFade, heightFade) {
        obj.turn = turn || (Math.floor(Math.random() * 2) - 0.5) * 0.2;
        obj.opacityFade = opacityFade || 1;
        obj.rotation = Math.random() * Math.PI * 2;
        obj.velocity = new game.Vector2(xVelocity || 0, yVelocity || 0);
        obj.widthFade = widthFade || 1;
        obj.heightFade = heightFade || 1;
        obj.type = "particle";
        obj.opacityThreshold = 0;
        obj.update = function (dt) {
            obj.rotation += obj.turn * dt;
            obj.width -= 0.4 * dt * obj.widthFade;
            obj.height -= 0.4 * dt * obj.heightFade;
            obj.opacity -= 0.02 * dt * obj.opacityFade;
            obj.position.x += obj.velocity.x * dt;
            obj.position.y += obj.velocity.y * dt;
            if (obj.opacity <= obj.opacityThreshold && game.particles.indexOf(obj) != -1) {
                game.particles.splice(game.particles.indexOf(obj), 1);
                if (obj.parent != null)
                    obj.parent.remove(obj);
            }
        }
        game.particles.push(obj);
        return obj;
    }
    game.scene = function () {
        var element = new game.object();
        element.type = "scene";
        element.camera = {
            position: new game.Vector2(0, 0),
            ratio: 1,
            rotation: 0
        }
        /*
        element.UI = new game.object();
        element.UI.roundRect = function () {
    
        }
        element.UI.buttons = [];
        element.UI.render = function (ctx, ratio, opacity) {
          element.UI.buttons.forEach(button => {
            button.render(ctx, ratio, opacity)
          });
        }
        element.UI.getButtonById = function (id) {
          for (var i = 0; i < element.UI.buttons.length; i++) {
            if (element.UI.buttons[i].buttonId == id) {
              return element.UI.buttons[i];
            }
          }
          return null;
        }
        */
        element.render = function (ctx, ratio, opacity) {
            ratio /= this.size;
            this.opacity = Math.min(Math.max(0, this.opacity), 1);
            ctx.globalAlpha = this.opacity * opacity;
            ctx.translate(-this.camera.position.x / ratio, -this.camera.position.y / ratio);
            ctx.rotate(-this.camera.rotation);

            //* Object Sorting
            this.objects.sort((a, b) => {
                if (a.scale < b.scale) {
                    return -1;
                }
                if (a.scale > b.scale) {
                    return 1;
                }
                return 0;
            });

            this.objects.sort((a, b) => {
                if (a.drawLayer < b.drawLayer) {
                    return -1;
                }
                if (a.drawLayer > b.drawLayer) {
                    return 1;
                }
                return 0;
            });

            //* Object Render
            this.belowObjects.forEach(function (object) {
                object.render(ctx, ratio * 1, opacity);
            });

            this.objects.forEach(function (object) {
                object.render(ctx, ratio * 1, opacity);
            });

            //! UI RENDER
            //this.UI.render(ctx, ratio, opacity);

            ctx.rotate(this.camera.rotation);
            ctx.translate(this.camera.position.x / ratio, this.camera.position.y / ratio);
        }
        game.scenes.push(element);
        return element;
    }

    game.setPingValues = function () {
        game.pingValues = [
            game.pingArray.reduce((p, c) => p + c, 0) / game.pingArray.length,
            Math.min(...game.pingArray),
            Math.max(...game.pingArray)
        ];
        game.pingArray = [];
    }

    // Networking Portion

    game.me = {
        id: -1,
        score: 0,
        visual: { position: new game.Vector2(0, 0) },
        new: { position: new game.Vector2(0, 0) },
        old: { position: new game.Vector2(0, 0) },
        fov: 1
    };
    game.ws = { readyState: -1, send: function () { }, close: function () { } };
    game.connecting = false;
    game.spectating = true;
    game.currentPackets = [];

    game.createSocket = function (serveraddr) {
        if (game.connecting)
            return;
        game.connecting = true;
        game.ws.close();
        function open() {
            game.connecting = false;
        }
        game.ws = new game.socket(serveraddr, game.messageEvent, open);
        game.ws.binaryType = "arraybuffer";
    }

    game.hasEnvs = false;

    game.serverDetails = {
        lastFrame: Date.now(),
        thisFrame: Date.now(),
        dt: 1,
        dtArray: [5.2, 5.2, 5.2, 5.2, 5.2, 5.2, 5.2, 5.2, 5.2, 5.2, 5.2],
        ticksSincePacket: 0
    };

    game.clientDetails = {
        lastFrame: Date.now(),
        thisFrame: Date.now(),
        dt: 1
    };

    game.toBuffer = function (string) {
        var buf = new ArrayBuffer(string.length);
        var bufView = new Uint8Array(buf);
        for (var i = 0, strLen = string.length; i < strLen; i++) {
            bufView[i] = string.charCodeAt(i);
        }
        return buf;
    }

    game.fromBuffer = function (buffer) {
        try {
            return String.fromCharCode.apply(null, new Uint8Array(buffer));
        } catch (e) {
        }
    }

    game.selfExists = function () {
        if (!game.hasEnvs) {
            game.currentPackets.push({ type: "getEnvs" });
        }
        for (var i = 0; i < game.objects.length; i++) {
            if (game.objects[i].id == game.me.id) {
                return true;
            }
        }
        if (game.ws.readyState == 1) {
            game.currentPackets.push({ type: "getID" });
        }
    }

    game.notUpdatedIsClose = function (object) {
        if (Math.abs(game.me.new.position.x - object.new.position.x) < 1920 / 2 + 1600 && Math.abs(game.me.new.position.y - object.new.position.y) < 1080 / 2 + 1600)
            return true;
    }

    game.visualIsClose = function (object) {
        if (Math.abs(game.me.new.position.x - object.position.x) < 1920 / 2 + 1600 && Math.abs(game.me.new.position.y - object.position.y) < 1080 / 2 + 1600)
            return true;
    }

    game.lerp = function (initialValue, newValue) {
        if (game.serverDetails.ticksSincePacket > game.serverDetails.dt + 5)
            return (newValue - initialValue) / game.serverDetails.dt * (game.serverDetails.dt + 5) + initialValue;
        return (newValue - initialValue) / game.serverDetails.dt * game.serverDetails.ticksSincePacket + initialValue;
    }

    game.getObj = function (id) {
        for (var i = 0; i < game.objects.length; i++) {
            if (game.objects[i].id == id) {
                return game.objects[i];
            }
        }
        return null;
    }

    game.askForObj = function (id) {
        game.currentPackets.push({ type: "getObject", object: { id: id } });
    }

    game.onGetEnvs = function (envs) {

    }

    game.packetFunctions = {
        "setID": function (packet) {
            game.spectating = packet.s;
            for (var i = 0; i < game.objects.length; i++) {
                if (game.objects[i].id == packet.id) {
                    const oldFov = game.me.fov;
                    game.me = game.objects[i];
                    game.me.fov = oldFov;
                }
            }
        },
        // Add
        "x": function (packet) {
            if (game.getObj(packet.i) != null) {
                return null;
            }
            var obj = {
                new: {
                    position: new game.Vector2(packet.x, packet.y),
                    mouseAngle: packet.a / 100,
                    rotation: packet.a / 100
                },
                old: {
                    position: new game.Vector2(packet.x, packet.y),
                    mouseAngle: packet.a / 100,
                    rotation: packet.a / 100
                },
                actualOld: {
                    position: new game.Vector2(packet.x, packet.y),
                    mouseAngle: packet.a / 100,
                    rotation: packet.a / 100
                },
                id: packet.i,
                ticksAsleep: 0,
                visual: new game.object(),
                type: packet.b,
                needsUpdate: packet.n,
                drawLayer: packet.drawLayer
            };

            if (obj.type === "player") {
                obj.cannon = new game.object();
                obj.turrets = [];
                obj.playerName = new game.object();
                game.me.hasBodyUpgrade = packet.hasBodyUpgrade;
                game.me.hasTurretUpgrade = packet.hasTurretUpgrade;
            }

            if (packet.maxHealth !== undefined) obj.maxHealth = packet.maxHealth;
            if (packet.health !== undefined) obj.health = packet.health;
            if (obj.health !== undefined) obj.healthBar = new game.object();

            if (packet.objType !== undefined) obj.objType = packet.objType;
            if (packet.subObjType !== undefined) obj.subObjType = packet.subObjType;
            if (game.types[packet.b] === undefined) {
                console.log(packet.b);
            }

            game.types[packet.b].create(obj, packet);

            obj.visual.position.x = obj.new.position.x;
            obj.visual.position.y = obj.new.position.y;
            obj.visual.rotation = obj.new.rotation;
            if (obj.cannon !== undefined) {
                obj.cannon.position.x = obj.new.position.x;
                obj.cannon.position.y = obj.new.position.y;
                obj.cannon.cannon = obj.new.mouseAngle;
            }
            if (obj.playerName !== undefined) {
                obj.playerName.fontSize = 26 / game.me.fov;
                obj.playerName.position.x = obj.new.position.x;
                obj.playerName.position.y = obj.new.position.y + 60 / game.me.fov;
            }
            if (obj.healthBar !== undefined) {
                obj.healthBar.position.x = obj.new.position.x;
                obj.healthBar.position.y = obj.new.position.y - 60 / game.me.fov;
            }
            if (obj.turrets !== undefined) {
                obj.turrets.forEach(turret => {
                    turret.position.x = obj.new.position.x;
                    turret.position.y = obj.new.position.y;
                    turret.rotation = obj.new.mouseAngle + turret.offsetAngle;
                });
            }
            game.objects.push(obj);
            return;
        },
        // Update
        "y": function (packet) {
            if (packet.lb) game.leaderboard = packet.lb;

            if (game.getObj(packet.a[0]) == null) {
                game.askForObj(packet.a[0]);
                return;
            }
            var obj = game.getObj(packet.a[0]);
            obj.visual.opacity = packet.opacity ?? 1;
            obj.ticksAsleep = 0;
            obj.old.position = obj.visual.position.clone();
            obj.old.rotation = obj.visual.rotation;
            if (obj.cannon) {
                obj.old.mouseAngle = obj.cannon.rotation;
            }
            obj.actualOld.position = obj.new.position.clone();
            obj.actualOld.rotation = obj.new.rotation;
            obj.actualOld.mouseAngle = obj.new.mouseAngle;
            obj.new.position = new game.Vector2(packet.a[1], packet.a[2]);

            obj.tank = packet.tank;
            obj.tier = packet.tier;
            if (obj.tank !== undefined) obj.visual.image.src = `./client/images/tanks/${obj.tier}/${obj.tank}/tank.png`;
            if (packet.turrets !== undefined)
                obj.turrets.forEach(turret => {
                    turret.parent.remove(turret);
                });
            obj.turrets = [];
            if (packet.xp !== undefined && obj.id === game.me.id) {
                game.renderers[0].UI.getLabelById("score").text.text = `Score: ${packet.xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
                game.actualLvl = packet.level;
                game.actualXp = packet.lvlPercent;
            }
            if (packet.hasBodyUpgrade !== undefined && obj.id === game.me.id) game.me.hasBodyUpgrade = packet.hasBodyUpgrade;
            if (packet.hasTurretUpgrade !== undefined && obj.id === game.me.id) game.me.hasTurretUpgrade = packet.hasTurretUpgrade;
            if (packet.tank !== undefined && packet.tier !== undefined && obj.id === game.me.id) {
                game.renderers[0].UI.buttons["tankButton"].forEach(button => {
                    let details = button.buttonId.split(":");
                    const disabledColor = "#c61010";
                    const ownedColor = "#29ab61";
                    const minOpacity = 0.7;
                    if (button.style.fill.default === ownedColor || button.style.fill.default === disabledColor) { button.enabled = false; } else { button.enabled = true; }
                    if (parseInt(details[1]) === 0 && parseInt(details[2]) === 0) { button.setOtherColors(true, ownedColor); button.enabled = false; } else {

                        button.opacity = (packet.level < parseInt(details[1]) * 10 + (parseInt(details[1]) - 1) * 10) ? minOpacity : 1;

                        if (button.opacity === minOpacity) button.setOtherColors(true, disabledColor);
                        if (button.opacity === 1) {
                            button.opacity = (parseInt(details[1]) > packet.tier + 1) ? minOpacity : 1;
                            if (button.opacity === 1) button.setOtherColors(true, "#29ab3a");
                            if (packet.tier === 0) { return; } else {
                                button.opacity = parseInt(details[2]) !== packet.tank ? minOpacity : 1
                            }
                            if (button.opacity === minOpacity) button.setOtherColors(true, disabledColor);
                            if (button.opacity === 1 && packet.tier >= parseInt(details[1])) button.setOtherColors(true, ownedColor);
                            //if (button.style.fill.default === ownedColor || button.style.fill.default === disabledColor) { button.enabled = false; } else { button.enabled = true; }
                        }
                    }
                });
            }

            if (packet.turrets !== undefined) {
                packet.turrets.forEach(turret => {
                    if (!turret.visible) return;
                    let turretImg = turretSwitch(turret.type);
                    let turretObj = new game.image(turretImg, 0, 0, 220 * turret.scale, 220 * turret.scale);
                    turretObj.offsetX = turret.offsetX / game.me.fov || 0;
                    turretObj.offsetY = turret.offsetY / game.me.fov || 0;
                    turretObj.ogOffsetX = turret.offsetX || 0;
                    turretObj.ogOffsetY = turret.offsetY || 0;
                    turretObj.offsetAngle = turret.offsetAngle || 0;
                    obj.turrets.push(turretObj);
                    game.scenes[0].add(turretObj, 3);
                });
            }
            obj.health = packet.health;

            if (isNaN(obj.old.position.x)) {
                obj.old.position.x = obj.new.position.x;
                obj.actualOld.position.x = obj.new.position.x;
                console.log("NaN X Value");
            }
            if (isNaN(obj.old.position.y)) {
                obj.old.position.y = obj.new.position.y;
                obj.actualOld.position.y = obj.new.position.y;
                console.log("NaN Y Value");
            }
            if (Math.abs(obj.visual.position.x - obj.new.position.x) < 0.3) {
                obj.old.position.x = obj.new.position.x;
            }
            if (Math.abs(obj.visual.position.y - obj.new.position.y) < 0.3) {
                obj.old.position.y = obj.new.position.y;
            }
            obj.new.rotation = packet.a[3] / 100;
            if (Math.abs(obj.old.rotation - obj.new.rotation) > Math.PI) {
                if (obj.old.rotation > obj.new.rotation)
                    obj.old.rotation -= Math.PI * 2;
                else
                    obj.old.rotation += Math.PI * 2;
            }
            obj.new.mouseAngle = packet.angle;
            if (Math.abs(obj.old.mouseAngle - obj.new.mouseAngle) > Math.PI) {
                if (obj.old.mouseAngle > obj.new.mouseAngle)
                    obj.old.mouseAngle -= Math.PI * 2;
                else
                    obj.old.mouseAngle += Math.PI * 2;
            }
            game.usedIDs.push(obj.id);
            game.types[obj.type].updatePacket(obj, packet);
        },
        // Remove
        "z": function (packet) {
            for (var i = 0; i < game.objects.length; i++) {
                if (game.objects[i].id == packet.i) {
                    if (game.types[game.objects[i].type].remove(game.objects[i], packet))
                        return;
                    if (game.objects[i].visual.parent != null)
                        game.objects[i].visual.parent.remove(game.objects[i].visual);
                    if (game.objects[i].cannon != null) if (game.objects[i].cannon.parent != null)
                        game.objects[i].cannon.parent.remove(game.objects[i].cannon);
                    if (game.objects[i].turrets != null) game.objects[i].turrets.forEach(turret => {
                        if (turret != null) turret.parent.remove(turret);
                    });
                    if (game.objects[i].playerName != null) if (game.objects[i].playerName.parent != null)
                        game.objects[i].playerName.parent.remove(game.objects[i].playerName);
                    if (game.objects[i].healthBar != null) if (game.objects[i].healthBar.parent != null)
                        game.objects[i].healthBar.parent.remove(game.objects[i].healthBar);
                    game.objects.splice(i, 1);
                    break;
                }
            }
        },
        // Get envs
        "e": function (packet) {
            if (!game.hasEnvs) {
                game.hasEnvs = true;
                game.envs = packet.envs;
                game.onGetEnvs(game.envs);
            }
        },
        //Set map / game scale
        "s": function (packet) {
            game.gameScale = packet.scale;
        },
        // Add global object
        "g": function (packet) {
            game.globalObjects.push({ i: packet.i, pos: packet.pos });
        },
        // Remove global object
        "h": function (packet) {
            for (let i = 0; i < game.globalObjects.length; i++) {
                const element = game.globalObjects[i];
                if (element.i === packet.i) game.globalObjects.splice(i, 1);
            }
        },
        // Set globals array
        "i": function (packet) {
            game.globalObjects = packet.list;
        },
        // Death
        "d": function (packet) {
            game.update();
            game.renderers[0].clear();
            game.renderers[0].drawEdge();
            game.renderers[0].drawBackground();
            game.renderers[0].drawGrid();
            game.renderers[0].render(game.scenes[0]);
            game.renderers[0].drawMinimap();
            game.renderers[0].drawLeaderboard();
            game.renderers[0].UI.render(game.renderers[0].ctx, game.renderers[0].ratio);
            game.renderers[0].drawPerformance();

            game.renderers[0].onDeathScreen = true;

            document.getElementById('death-screen').style.display = "block";
            const dc = document.getElementById("death-canvas");
            dc.style.position = "fixed";
            dc.style.top = 0;
            dc.style.left = 0;
            dc.style.zIndex = "100";
            dc.width = window.innerWidth;
            dc.height = window.innerHeight;
            const deathCanvas = dc.getContext("2d");

            const returnToMenu = document.getElementById("return");
            returnToMenu.style.zIndex = "1000";
            returnToMenu.style.position = "absolute";
            returnToMenu.style.marginTop = window.innerHeight * 17 / 32;

            deathCanvas.clearRect(0, 0, window.innerWidth, window.innerHeight);
            const oldImg = game.renderers[0].ctx.getImageData(
                normalizeCoords(-window.innerWidth / 2, game.renderers[0].position.x, game.renderers[0].ratio, game.renderers[0].c.width),
                normalizeCoords(-window.innerHeight / 2, game.renderers[0].position.y, game.renderers[0].ratio, game.renderers[0].c.height),
                window.innerWidth, window.innerHeight
            );
            deathCanvas.putImageData(oldImg, 0, 0);

            deathCanvas.globalAlpha = 0.5;
            deathCanvas.fillStyle = "#000000";
            deathCanvas.fillRect(0, 0, window.innerWidth, window.innerHeight);
            deathCanvas.globalAlpha = 1;

            let ms = packet.time;
            let seconds = ~~(ms / 1000);
            let minutes = ~~(seconds / 60);
            let hours = ~~(minutes / 60);
            ms -= seconds * 1000;
            seconds -= minutes * 60
            minutes -= hours * 60;
            let totalTime = "Time alive: ";
            if (hours) totalTime += `${hours}h `;
            if (minutes) totalTime += `${minutes}m `;
            totalTime += `${seconds}.${('000' + ms).slice(-3)}s`;

            deathCanvas.font = "30px Montserrat";
            deathCanvas.fillStyle = "#ffffff";
            let width = deathCanvas.measureText("You died : (").width;
            deathCanvas.fillText("You died : (", window.innerWidth / 2 - width / 2, window.innerHeight * 1 / 6);
            width = deathCanvas.measureText(totalTime).width;
            deathCanvas.fillText(totalTime, window.innerWidth / 2 - width / 2, window.innerHeight * 2 / 6);
            game.totalTime = totalTime;
            returnToMenu.addEventListener("click", () => {
                document.getElementById('death-screen').style.display = "none";
                document.getElementById('menu').style.display = "flex";
                game.renderers[0].onDeathScreen = false;
            });
        },
        // Clear and update turrets
        "tt": function (packet) {
            game.renderers[0].UI.buttons["turretButton"] = [];
            /*
            let buttons = game.renderers[0].UI.buttons;
            for (let i = 0; i < buttons.length; i++) {
                const button = buttons[i];
                console.log(button.buttonId.split(":")[0]);
                if (button.buttonId.split(":")[0] === "turretButton") buttons.splice(i, 1);
            }*/

            for (let i = 0; i < packet.turrets[0].length; i++) {
                const tierIndexArray = packet.turrets[0][i];
                const turretsArray = packet.turrets[1][i];
                let batch = [];

                turretsArray.forEach(turret => {
                    if (!turret.visible) return;
                    let turretImg = turretSwitch(turret.type);
                    let turretObj = new game.image(turretImg, 0, 0, 200 * turret.scale, 200 * turret.scale, 100, 0, 0, true);
                    turretObj.offsetX = turret.offsetX || 0;
                    turretObj.offsetY = turret.offsetY || 0;
                    turretObj.offsetAngle = turret.offsetAngle || 0;
                    turretObj.rotation = Math.PI / 2;
                    batch.push(turretObj);
                });

                let cannon = new Image();
                cannon.src = `./client/images/turrets/default.png`;
                let cannonImg = new game.image(cannon, 0, 0, 200, 200, 100, 0, 0, true);
                cannonImg.rotation = Math.PI / 2;

                let style = { fill: { default: "#29AB61" }, stroke: { lineWidth: 4 } };
                let button = new game.button(`turretButton:${tierIndexArray[0]}:${tierIndexArray[1]}`, { x: 2, y: 2 }, 300 + i * 120, 60, 100, 100, 10, style, cannonImg, function () {
                    game.addPacket("upgradePacket", ["turret", { tier: tierIndexArray[0], turreti: tierIndexArray[1] }]);
                }, 1, batch)
                game.renderers[0].addButton(button);
            }
        },
        // Playercount
        "p": function (packet) {
            document.getElementById("playerCount").innerHTML = `${packet.count} player${packet.count > 1 ? "s" : ""} shooting`
        },
        // tick stats
        "t": function (packet) {
            game.serverStats = packet.data;
        },
        "ping": function (packet) {
            game.pingArray.push(Date.now() - packet.data);
        },
        // fov change
        "f": function (packet) {
            game.me.fov = packet.fov;
        }
    };
    game.addPacketType = function (type, func) {
        game.packetFunctions[type] = func;
    }
    game.addPacket = function (type, data) {
        if (game.ws.readyState == 1)
            game.currentPackets.push({ type: type, object: data });
    }
    game.types = [];
    game.objects = [];
    game.globalObjects = [];
    game.usedIDs = [];

    game.messageEvent = function (message) {
        game.serverDetails.thisFrame = Date.now();
        /*for( var i = 0; i < game.serverDetails.dtArray.length - 1; i++ ) {
          game.serverDetails.dtArray[ i ] = game.serverDetails.dtArray[ i + 1 ];
        }
        game.serverDetails.dtArray[ game.serverDetails.dtArray.length - 1 ] = Math.max( Math.min( ( game.serverDetails.thisFrame - game.serverDetails.lastFrame ) / 16, 8.2 ), 2.2 );
        var sum = 0;
        for( var i = 0; i < game.serverDetails.dtArray.length; i++ ) {
          sum += game.serverDetails.dtArray[ i ];
        }
        game.serverDetails.dt = sum / game.serverDetails.dtArray.length;*/
        game.serverDetails.dt = 5.5; //4.6
        game.serverDetails.lastFrame = game.serverDetails.thisFrame;
        //try {
        if (msgpack !== undefined) {
            var packets = msgpack.decode(new Uint8Array(message.data));
            for (var i = 0; i < packets.length; i++) {
                var packet = packets[i];
                if (game.packetFunctions[packet.t] !== undefined)
                    game.packetFunctions[packet.t](packet);
                else {
                    console.log("Encountered issue: unknown packet type");
                    console.log(packets);
                }
            }
        }
        /*game.particles.forEach( function( particle ) {
          particle.update( 1 );
        } );*/
        for (var i = 0; i < game.objects.length; i++) {
            game.objects[i].ticksAsleep++;
            if (game.usedIDs.indexOf(game.objects[i].id) == -1) {
                game.objects[i].old.position.x = game.objects[i].visual.position.x;
                game.objects[i].old.position.y = game.objects[i].visual.position.y;
                game.objects[i].old.rotation = game.objects[i].visual.rotation;
                if (game.objects[i].cannon) game.objects[i].old.mouseAngle = game.objects[i].cannon.rotation;
            }
            if (((game.objects[i].needsUpdate && (game.objects[i].ticksAsleep > 201 && (game.objects[i].old.position.x == game.objects[i].new.position.x && game.objects[i].old.position.y == game.objects[i].new.position.y && game.objects[i].old.rotation == game.objects[i].new.rotation))) || (!game.objects[i].needsUpdate && game.objects[i].ticksAsleep >= 120 && !game.notUpdatedIsClose(game.objects[i]))) && game.usedIDs.indexOf(game.objects[i].id) == -1) {
                if (game.types[game.objects[i].type].remove(game.objects[i], {}))
                    continue;
                if (game.objects[i].visual.parent != null)
                    game.objects[i].visual.parent.remove(game.objects[i].visual);
                if (game.objects[i].cannon != null) if (game.objects[i].cannon.parent != null)
                    game.objects[i].cannon.parent.remove(game.objects[i].cannon);
                if (game.objects[i].turrets != null) game.objects[i].turrets.forEach(turret => {
                    if (turret.parent != null) turret.parent.remove(turret);
                });
                if (game.objects[i].playerName != null) if (game.objects[i].playerName.parent != null)
                    game.objects[i].playerName.parent.remove(game.objects[i].playerName);
                if (game.objects[i].healthBar != null) if (game.objects[i].healthBar.parent != null)
                    game.objects[i].healthBar.parent.remove(game.objects[i].healthBar);
                game.objects.splice(i, 1);
            }
        }
        game.usedIDs = [];
        game.selfExists();
        game.serverDetails.ticksSincePacket = 0;
        /*} catch( e ) {
                console.log( "Caught Error, plx report" );
        }*/
    }
    game.update = function () {
        var currentFPS = Math.max(fps.getFPS(), 30);
        game.serverDetails.ticksSincePacket += 1 / (currentFPS / 60);
        //game.serverDetails.ticksSincePacket += 1;

        for (var i = 0; i < game.objects.length; i++) {
            var obj = game.objects[i];
            obj.visual.rotation = game.lerp(obj.old.rotation, obj.new.rotation);
            obj.visual.position.x = game.lerp(obj.old.position.x, obj.new.position.x);
            obj.visual.position.y = game.lerp(obj.old.position.y, obj.new.position.y);
            if (obj.cannon) {
                obj.cannon.position.x = game.lerp(obj.old.position.x, obj.new.position.x);
                obj.cannon.position.y = game.lerp(obj.old.position.y, obj.new.position.y);
                obj.cannon.rotation = game.lerp(obj.old.mouseAngle, obj.new.mouseAngle);
            }
            if (obj.playerName) {
                obj.playerName.fontSize = 26 / game.me.fov;
                obj.playerName.position.x = game.lerp(obj.old.position.x, obj.new.position.x);
                obj.playerName.position.y = game.lerp(obj.old.position.y, obj.new.position.y) + 60 / game.me.fov;
            }
            if (obj.healthBar) {
                if (obj.healthBar.type !== "roundRectangle") {
                    obj.healthBar = new game.roundRectangle(0, 0, (obj.health / obj.maxHealth) * 100 / game.me.fov, 10 / game.me.fov, 3, "#FF0000");
                    this.scenes[0].add(obj.healthBar, 10);
                }

                obj.healthBar.position.x = game.lerp(obj.old.position.x, obj.new.position.x);
                obj.healthBar.position.y = game.lerp(obj.old.position.y, obj.new.position.y) - 60 / game.me.fov;

                obj.healthBar.height = 10 / game.me.fov;
                if (obj.health !== obj.maxHealth) {
                    obj.healthBar.opacity = 1;
                    obj.healthBar.width = (obj.health / obj.maxHealth) * 100 / game.me.fov;
                } else {
                    obj.healthBar.opacity = 0;
                }
            }
            if (obj.turrets !== undefined) {
                obj.turrets.forEach(turret => {
                    turret.offSetX = turret.ogOffsetX / game.me.fov;
                    turret.offsetY = turret.ogOffsetY / game.me.fov;
                    turret.position.x = game.lerp(obj.old.position.x, obj.new.position.x);
                    turret.position.y = game.lerp(obj.old.position.y, obj.new.position.y);
                    turret.rotation = game.lerp(obj.old.mouseAngle + turret.offsetAngle, obj.new.mouseAngle + turret.offsetAngle);
                });
            }
            game.types[obj.type].tickUpdate(obj);
        }
        game.clientDetails.thisFrame = Date.now();
        game.clientDetails.dt = Math.min((game.clientDetails.thisFrame - game.clientDetails.lastFrame) / 16.67, 2);
        game.clientDetails.lastFrame = game.clientDetails.thisFrame;
        game.particles.forEach(function (particle) {
            particle.update(game.clientDetails.dt * 1.2);
        });
        if (game.ws.readyState == 1 && game.currentPackets.length > 0) {
            game.ws.send(msgpack.encode(game.currentPackets));
            game.currentPackets = [];
        }

        // Score smoothing
        if (game.clientLvl < game.actualLvl) {
            game.clientXp += Math.max(smoothing * (game.actualLvl + game.actualXp - game.clientLvl - game.clientXp), 0.001);
            while (game.clientXp >= 1) {
                game.clientLvl++;
                game.clientXp -= 1;
            }
        }
        if (game.clientLvl === game.actualLvl) {
            game.clientXp += Math.max(smoothing * (game.actualLvl + game.actualXp - game.clientLvl - game.clientXp), 0.001);
            if (game.clientXp > game.actualXp) game.clientXp = game.actualXp;
        }
        game.renderers[0].UI.getLabelById("level").width = 420 * game.clientXp;
        game.renderers[0].UI.getLabelById("level").text.text = `Level ${game.clientLvl}`;
    }
    game.addType = function (type, create, tickUpdate, updatePacket, remove) {
        game.types[type] = {
            create: create,
            tickUpdate: tickUpdate || function (obj) { },
            updatePacket: updatePacket || function (obj, packet) { },
            remove: remove || function (obj) { }
        };
    }


    game.addType(
        "spectator",
        function (obj, packet) {
            obj.visual = new game.object();
        },
        function () { },
        function () { }
    );
    return game;
}
var requestFrame = function (callback) {
    (window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function (callback) {
            setTimeout(callback, 1000 / 60);
        }
    )(callback);
};