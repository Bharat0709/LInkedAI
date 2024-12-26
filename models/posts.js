const post = {
  organizationId: 'string',
  memberId: 'string',
  impressions: 0,
  likes: 0,
  comments: [],
  reposts: 0,
  link: 'string',
  views: 0,
  dateTime: 'string',
  media: 'string',
  content: 'string',

  audience: {
    jobTitles: ['string'],
    companies: ['string'],
    locations: ['string'],
    companySize: ['string'],
    industries: ['string'],
  },

  commentsDetails: [
    {
      by: {
        name: 'string',
        image: 'string',
      },
      when: 'string',
      content: 'string',
    },
  ],
};
