/*
 * Copyright 2025, gematik GmbH
 *
 * Licensed under the EUPL, Version 1.2 or - as soon they will be approved by the
 * European Commission – subsequent versions of the EUPL (the "Licence").
 * You may not use this work except in compliance with the Licence.
 *
 * You find a copy of the Licence in the "Licence" file or at
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * In case of changes by gematik find details in the "Readme" file.
 *
 * See the Licence for the specific language governing permissions and limitations under the Licence.
 */

import { HTTP_METHODS, httpClient } from '@/main/services/http-client';
import { httpReqConfig } from '@/renderer/modules/connector/services';
import { CONNECTOR_URLS, ESlotActions, ETerminalTypes } from '@tests/TestInfo';

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
          }, 2000);
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
