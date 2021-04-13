game.addType(
    // Type
    "bullet",
    // Create
    function (obj, extra) {
        obj.bulletType = extra.type;

        obj.damage = extra.damage;
        obj.scale = extra.scale;
        obj.bulletSpeedMult = extra.bulletSpeedMult;
        if (obj.bulletType === 1) obj.bulletSpeedMult = obj.bulletSpeedMult * 0.7 + obj.bulletSpeedMult * Math.random();

        obj.lifespan = 0;
        obj.lifespanCap = 40 * extra.lifespanMult;

        obj.body = new game.body(0);
        obj.body.type = 5;
        obj.body.angle = extra.angle;
        obj.body.addShape(new game.circle(10 * obj.scale));

        obj.ownerID = extra.ownerID;
        obj.body.position = extra.pos;
        obj.needsUpdate = true;
    },
    // Tick Update
    function (obj) {
        handleMovement(obj);
        obj.lifespan++;
        if (obj.lifespan >= obj.lifespanCap) game.remove(obj);

        obj.body.owner = obj;
    },
    // Packet Update
    function (obj, packet) {
        packet.angle = obj.body.angle;
    },
    // Add
    function (obj, packet) {
        packet.x = obj.body.position[0];
        packet.y = obj.body.position[1];
        packet.angle = obj.body.angle;
        packet.bulletType = obj.bulletType;
        packet.scale = obj.scale;
    }
);

const handleMovement = (obj) => {
    obj.body.velocity[0] = -Math.cos(obj.body.angle) * 600 * obj.bulletSpeedMult;
    obj.body.velocity[1] = -Math.sin(obj.body.angle) * 600 * obj.bulletSpeedMult;
}

game.addCollision("bullet", "bullet", (b1, b2) => {
    if (b1.ownerID === b2.ownerID) return;
    // destroyer line bullets destroy other bullets
    if (b1.bulletType === 6 || b1.bulletType === 7 || b1.bulletType === 8) { 
        game.remove(b2);
    }
    if (b2.bulletType === 6 || b2.bulletType === 7 || b2.bulletType === 8) {
        game.remove(b1);
    }
});

game.addCollision('bullet', 'object', (bullet, object) => {

    // hunter bullets goes through trees
    if (bullet.bulletType === 4 && object.objType === 0) return;
    game.remove(bullet);
    object.health -= bullet.damage;
    if (!game.findObjectById(bullet.ownerID, true)) return;
    if (object.health <= 0 && game.findObjectById(bullet.ownerID).lastDestroyed !== object.id) {
        if (object.objType <= 1) {
            game.findObjectById(bullet.ownerID).xp += object.baseScore + Math.round((object.scale - 1) / 1 * 10);
        } else {
            game.findObjectById(bullet.ownerID).xp += object.baseScore;
        }
        game.findObjectById(bullet.ownerID).lastDestroyed = object.id;
    }
});

game.addCollision('bullet', 'wall', (bullet, wall) => {
    game.remove(bullet);
});

game.addCollision('bullet', 'player', (bullet, player) => {
    if (bullet.ownerID !== player.id) {
        game.remove(bullet);
        if (player.invincible) return;
        player.health -= bullet.damage / player.props.healthMod;
        if (!game.findObjectById(bullet.ownerID, true)) return;
        if (player.health <= 0 && game.findObjectById(bullet.ownerID).lastDestroyed !== player.id) {
            const you = game.findObjectById(bullet.ownerID);
            const them = game.findObjectById(player.id);
            let theirScore = game.findObjectById(player.id).xp;
            if (theirScore > 50623) {
                theirScore -= (theirScore - 50623) * 9/10;
            }
            let scoreToGive = Math.round(
                Math.min(
                    Math.max(
                        Math.round(theirScore * (0.5 * (them.level / (you.level || 1)))),
                        theirScore * 0.1
                    ),
                    theirScore * 0.9
                )
            );
            if (them.level === 60 && you.xp + scoreToGive < 50623) scoreToGive = 50623 - you.xp;
            game.findObjectById(bullet.ownerID).xp += scoreToGive;
            game.findObjectById(bullet.ownerID).lastDestroyed = player.id;
        } else player.regen = Date.now() + player.props.timeToRegen;
    }
});