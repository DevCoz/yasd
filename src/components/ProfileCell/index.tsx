/** @jsx jsx */
import { jsx } from '@emotion/core'
import axios from 'axios'
import React, { MouseEventHandler, useEffect, useState } from 'react'
import styled from '@emotion/styled/macro'
import css from '@emotion/css/macro'
import tw from 'twin.macro'
import { Bin } from '@sumup/icons'
import { IconButton } from '@sumup/circuit-ui'

import { Profile } from '../../types'

interface ProfileCellProps {
  profile: Profile
  checkConnectivity?: boolean
  onClick?: MouseEventHandler
  showDelete?: boolean
  onDelete?: MouseEventHandler
}

const ProfileCell: React.FC<ProfileCellProps> = ({
  profile,
  checkConnectivity,
  onClick,
  showDelete,
  onDelete,
}) => {
  const [available, setAvailable] = useState<boolean | undefined>(undefined)

  const clickHandler: MouseEventHandler = (e) => {
    e.stopPropagation()
    e.preventDefault()

    if (available && onClick) {
      onClick(e)
    }
  }

  const deleteHandler: MouseEventHandler = (e) => {
    e.stopPropagation()
    e.preventDefault()

    if (onDelete) {
      onDelete(e)
    }
  }

  const getCursorStyle = () => {
    if (onClick) {
      if (available) {
        return tw`cursor-pointer`
      }
      return tw`cursor-not-allowed`
    }
    return null
  }

  useEffect(() => {
    let isMounted = true

    if (checkConnectivity) {
      axios
        .request({
          url: `//${profile.host}:${profile.port}/v1/outbound`,
          method: 'GET',
          headers: {
            'x-key': profile.key,
          },
        })
        .then(() => {
          if (isMounted) setAvailable(true)
        })
        .catch(() => {
          if (isMounted) setAvailable(false)
        })
    }

    return () => {
      isMounted = false
    }
  }, [profile, checkConnectivity])

  return (
    <div
      key={profile.id}
      tw="flex flex-row justify-between items-center p-3"
      css={[getCursorStyle()]}
      onClick={clickHandler}>
      <div tw="truncate text-sm md:text-base">{profile.name}</div>
      <div tw="flex items-center">
        {checkConnectivity && (
          <div className="relative flex h-3 w-3 mr-3">
            {available && (
              <span tw="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            )}
            <span
              css={[
                tw`relative inline-flex rounded-full h-3 w-3`,
                available === undefined && tw`bg-gray-500`,
                available === true && tw`bg-green-500`,
                available === false && tw`bg-red-500`,
              ]}
            />
          </div>
        )}
        <div tw="font-mono text-gray-600 text-xs md:text-sm truncate leading-tight">
          {profile.host}:{profile.port}
        </div>
        {showDelete && (
          <IconButton
            onClick={deleteHandler}
            label={'delete profile'}
            css={[
              tw`w-6 h-6 rounded-full text-gray-600 ml-2`,
              css`
                padding: 0.3rem;

                svg {
                  ${tw`transition-colors duration-200 ease-in-out`}
                }
                &:hover svg {
                  ${tw`text-gray-700`}
                }
              `,
            ]}>
            <Bin />
          </IconButton>
        )}
      </div>
    </div>
  )
}

export default ProfileCell