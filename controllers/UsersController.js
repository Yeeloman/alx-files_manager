import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import sha1 from 'sha1';
import { ObjectID } from 'mongodb';

class UserController {
  static postNew (req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const users = dbClient.db.collection('users');
    users.findOne({ email }, (_, user) => {
      if (user) {
        res.status(400).json({ error: 'Already exist' });
      } else {
        const hashedpwd = sha1(password);
        users.insertOne({
          email,
          password: hashedpwd
        }).then((result) => {
          res.status(201).json({
            id: result.insertedId,
            email
          });
        }).catch((err) => console.log(err));
      }
    });
  }

  static async getMe (req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (userId) {
      const users = dbClient.db.collection('users');
      const idObj = new ObjectID(userId);
      users.findOne({ _id: idObj }, (err, user) => {
        if (user) {
          res.status(200).json({ id: userId, email: user.email });
        } else {
          res.status(401).json({ error: 'Unauthorized' });
        }
      });
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}

module.exports = UserController;
