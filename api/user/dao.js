const _ = require('lodash');
const dao = require('postgres-gen-dao');
const badgeDescriptions = require('../../utils').badgeDescriptions;

const userQuery = 'select @m_user.id, @m_user.name, @m_user.title, @tags.* ' +
  'from @midas_user m_user ' +
  'left join tagentity_users__user_tags user_tags on user_tags.user_tags = m_user.id ' +
  'left join @tagentity tags on tags.id = user_tags.tagentity_users ';

const tagQuery = 'select tags.* ' +
  'from tagentity tags ' +
  'inner join tagentity_users__user_tags user_tags on tags.id = user_tags.tagentity_users ' +
  'where user_tags.user_tags = ?';

const taskCompletedQuery = 'select distinct task.* ' +
  'from task inner join volunteer on task.id = volunteer."taskId" ' +
  'where volunteer."userId" = ?';

const deleteUserTags = 'delete from tagentity_users__user_tags where user_tags = ?';

const options = {
  user: {
    fetch: {
      tags: [],
    },
    exclude: {
      tags: [ 'deletedAt', 'createdAt', 'updatedAt', 'data' ],
    },
  },
};

const clean = {
  users: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.tags = (cleaned.tags || []).map(function (tag) {
        return _.pickBy(tag, _.identity);
      });
      return cleaned;
    });
  },
  profile: function (record) {
    var cleaned = _.pickBy(record, _.identity);
    cleaned.badges = (cleaned.badges || []).map(function (badge) {
      return _.pickBy(badge, _.identity);
    });
    cleaned.tags = (cleaned.tags || []).map(function (tag) {
      return _.pickBy(tag, _.identity);
    });
    return cleaned;
  },
  activity: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.owner = cleaned.userId;
      if(!_.isEmpty(cleaned.restrict)) {
        cleaned.restrict = JSON.parse(cleaned.restrict);
      }
      return cleaned;
    });
  },
  badge: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.description = badgeDescriptions[record.type];
      return cleaned;
    });
  },
};

module.exports = function (db) {
  return {
    User: dao({ db: db, table: 'midas_user' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    UserTags: dao({ db: db, table: 'tagentity_users__user_tags' }),
    Badge: dao({ db: db, table: 'badge'}),
    Task: dao({ db: db, table: 'task' }),
    Passport: dao({ db: db, table: 'passport' }),
    query: {
      user: userQuery,
      tag: tagQuery,
      completed: taskCompletedQuery,
      deleteUserTags: deleteUserTags,
    },
    options: options,
    clean: clean,
  };
};