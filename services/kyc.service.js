import { Kyc } from 'models';

export async function getkycById(id, options = {}) {
  const kyc = await Kyc.findById(id, options.projection, options);
  return kyc;
}

export async function getOne(query, options = {}) {
  const kyc = await Kyc.findOne(query, options.projection, options);
  return kyc;
}

export async function getkycList(filter, options = {}) {
  const kyc = await Kyc.find(filter, options.projection, options);
  return kyc;
}

export async function getkycListWithPagination(filter, options = {}) {
  const kyc = await Kyc.paginate(filter, options);
  return kyc;
}

export async function createkyc(body = {}) {
  const kyc = await Kyc.create(body);
  return kyc;
}

export async function updatekyc(filter, body, options = {}) {
  const kyc = await Kyc.findOne(filter, null, options);
  if (!kyc) return null;
  if (body.kycDocName) kyc.kycDocName = body.kycDocName;
  if (body.kycDocImagePath) kyc.kycDocImagePath = body.kycDocImagePath;
  if (body.nameRequest) kyc.nameRequest = body.nameRequest;

  // Ensure history array exists
  if (!Array.isArray(kyc.docUploadHistory)) {
    kyc.docUploadHistory = [];
  }

  // Add history from latest nameRequest entry if valid
  if (Array.isArray(body.nameRequest) && body.nameRequest.length > 0) {
    const latestRequest = body.nameRequest[body.nameRequest.length - 1];

    if (latestRequest.kycDocName && latestRequest.kycDocImagePath) {
      const statusHistory = {
        kycDocName: latestRequest.kycDocName,
        kycDocImagePath: latestRequest.kycDocImagePath,
        uploadedAt: new Date(),
        firstName: latestRequest.firstName || null,
        lastName: latestRequest.lastName || null,
      };

      kyc.docUploadHistory.push(statusHistory); // ✅ Add a new record each time
    }
  }

  // Save the document
  await kyc.save();
  return kyc;
}

export async function updateManykyc(filter, body, options = {}) {
  const kyc = await Kyc.updateMany(filter, body, options);
  return kyc;
}

export async function removekyc(filter) {
  const kyc = await Kyc.findOneAndRemove(filter);
  return kyc;
}

export async function removeManykyc(filter) {
  const kyc = await Kyc.deleteMany(filter);
  return kyc;
}
