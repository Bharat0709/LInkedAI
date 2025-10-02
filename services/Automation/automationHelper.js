export const formatStatusCounts = statusStats => {
  const formattedStatusCounts = {
    all: 0,
    pending_approval: 0,
    approved: 0,
    rejected: 0,
    sent: 0,
    failed: 0,
    scheduled: 0,
  };

  statusStats.forEach(stat => {
    if (formattedStatusCounts[stat._id] !== undefined) {
      formattedStatusCounts[stat._id] = stat.count;
      formattedStatusCounts.all += stat.count;
    }
  });

  return formattedStatusCounts;
};

export const formatTypeCounts = typeStats => {
  const formattedTypeCounts = {};

  typeStats.forEach(stat => {
    formattedTypeCounts[stat._id] = stat.count;
  });

  return formattedTypeCounts;
};

export const formatDeliveryCounts = deliveryStats => {
  const formattedDeliveryCounts = {
    pending: 0,
    delivered: 0,
    bounced: 0,
    failed: 0,
    opened: 0,
    clicked: 0,
  };

  deliveryStats.forEach(stat => {
    if (formattedDeliveryCounts[stat._id] !== undefined) {
      formattedDeliveryCounts[stat._id] = stat.count;
    }
  });

  return formattedDeliveryCounts;
};
