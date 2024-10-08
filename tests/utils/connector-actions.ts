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

import { HTTP_METHODS, httpClient } from "@/main/services/http-client";
import { httpReqConfig } from "@/renderer/modules/connector/services";
import { CONNECTOR_URLS, ESlotActions, ETerminalTypes } from "@tests/TestInfo";

interface ConnectorActionConfig {
  terminal: ETerminalTypes;
  slots?: number[];
  actionType?: ESlotActions;
}

const config: ConnectorActionConfig = {
  terminal: ETerminalTypes.LOCAL,
  slots: [],
  actionType: ESlotActions.INSERT,
};

export const connectorAction = () => {
  return {
    localTerminal: () => {
      config.terminal = ETerminalTypes.LOCAL;
      return selectSlot();
    },
    remoteTerminal: () => {
      config.terminal = ETerminalTypes.REMOTE;
      return selectSlot();
    },
  };
};

const selectSlot = () => {
  return {
    allSlots: () => {
      config.slots = [1, 2, 3];
      return selectAction();
    },
    slot1: () => {
      config.slots = [1];
      return selectAction();
    },
    slot2: () => {
      config.slots = [2];
      return selectAction();
    },
    slot3: () => {
      config.slots = [3];
      return selectAction();
    },
    slots1And2: () => {
      config.slots = [1, 2];
      return selectAction();
    },
    slots2And3: () => {
      config.slots = [2, 3];
      return selectAction();
    },
    slots1And3: () => {
      config.slots = [1, 3];
      return selectAction();
    },
  };
};

const selectAction = () => {
  return {
    insert: () => {
      config.actionType = ESlotActions.INSERT;
      return execute();
    },
    eject: () => {
      config.actionType = ESlotActions.EJECT;
      return execute();
    },
  };
};

const execute = async () => {
  const { terminal, slots, actionType } = config;
  try {
    if (!actionType) {
      throw new Error('Action type is missing.');
    }
    if (!slots) {
      throw new Error('Slots information is missing.');
    }

    for (const slot of slots) {
      const data = {
        slotNumber: slot,
        inserted: actionType === ESlotActions.INSERT,
      };

      await httpClient(HTTP_METHODS.POST, CONNECTOR_URLS[terminal], httpReqConfig(), data);
      if (actionType === ESlotActions.INSERT) {
        // sleep 100ms
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve(true);
          }, 100);
        });
      }
    }
  } catch (e) {
    throw new Error(
      `Connector Action has failed. 
        Could not run the ${actionType} action on the ${terminal} terminal for slot(s) ${slots}. Error: ` + e.message,
    );
  }
};
