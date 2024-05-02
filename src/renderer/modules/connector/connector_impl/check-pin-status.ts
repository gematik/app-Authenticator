/*
 * Copyright 2024 gematik GmbH
 *
 * The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App
 * Sourcecode must be in compliance with the EUPL.
 *
 * You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS
 * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific
 * language governing permissions and limitations under the License.ee the Licence for the specific language governing
 * permissions and limitations under the Licence.
 */

import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { logger } from '@/renderer/service/logger';
import { launch as pinStatusLauncher } from '@/renderer/modules/connector/connector_impl/get-pin-status-launcher';
import cardHandleParser from '@/renderer/modules/connector/common/soap-response-xml-parser';
import { UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';
import { TPinStatusResponse, TPinStatusTypes } from '@/renderer/modules/connector/type-definitions';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';

let statusResult: string, pinStatus: TPinStatusTypes;
export const getPinStatus = async (
  cardType: ECardTypes,
  cardHandle: string,
  returnValue = false,
): Promise<TPinStatusResponse> => {
  try {
    const pinStatusResp = await pinStatusLauncher(cardType, cardHandle);
    statusResult = cardHandleParser(pinStatusResp, XML_TAG_NAMES.TAG_VERIFY_RESULT);
    logger.debug(`statusResult: ${statusResult}`);
    pinStatus = cardHandleParser(pinStatusResp, XML_TAG_NAMES.TAG_PINSTATUS) as TPinStatusTypes;
    logger.debug(`pinStatus: ${pinStatus}`);
    if (returnValue) {
      return { statusResult, pinStatus };
    }
    if (pinStatus === 'BLOCKED' || pinStatus === 'REJECTED') {
      throw new UserfacingError('Technical error pin status not verified', '', ERROR_CODES.AUTHCL_1103, {
        cardType,
      });
    }
    if (pinStatus === 'TRANSPORT_PIN') {
      throw new UserfacingError('Technical error pin status not verified', '', ERROR_CODES.AUTHCL_1120, {
        cardType,
      });
    }
    return { statusResult, pinStatus };
  } catch (error) {
    logger.error('An error occurred while getting PIN status:', error.message);
    throw error;
  }
};
