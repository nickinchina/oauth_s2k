--DROP PROCEDURE [hq].[sp_oauth_get_token]
CREATE OR ALTER PROCEDURE [hq].[sp_oauth_get_token]
	@token nvarchar(500),
	@type tinyint=0
AS
BEGIN
	SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, a.user_id,
		(select x.id, case when x.accountid=-1 then 's2k' else y.name end as account, x.name, x.email from hq.pz_user x inner join hq.pz_account y on x.accountid=y.id
		where x.id=a.user_id for json path, without_array_wrapper) as [user]
	  FROM hq.oauth_tokens a
	 WHERE (access_token=@token AND @type=0) 
		OR (refresh_token=@token AND @type=1);
END
GO
--DROP PROCEDURE [hq].[sp_oauth_get_client]
CREATE OR ALTER PROCEDURE [hq].[sp_oauth_get_client]
	@client_id nvarchar(500),
	@client_secret nvarchar(500)
AS
BEGIN
	SELECT client_id, client_secret, redirect_uri
	  FROM hq.oauth_clients 
	 WHERE client_id=@client_id AND (@client_secret is null or client_secret=@client_secret);
END
GO
--DROP PROCEDURE [hq].[sp_oauth_get_user]
CREATE OR ALTER PROCEDURE [hq].[sp_oauth_get_user]
	@username nvarchar(100),
	@password nvarchar(100)
AS
BEGIN
	SELECT * FROM hq.pz_user WHERE email=@username AND password=@password;
END
GO
--DROP PROCEDURE [hq].[sp_oauth_save_token]
CREATE OR ALTER PROCEDURE [hq].[sp_oauth_save_token]
	@access_token nvarchar(500),
	@access_token_expires_on datetime,
	@client_id nvarchar(500),
	@refresh_token nvarchar(500),
	@refresh_token_expires_on datetime,
	@user_id int
AS
BEGIN
	INSERT INTO [hq].[oauth_tokens](
		[id],
		[access_token],
		[access_token_expires_on],
		[client_id],
		[refresh_token],
		[refresh_token_expires_on],
		[user_id])
	OUTPUT inserted.[access_token] as accessToken
	 VALUES
		(NEWID(),
		@access_token,
		@access_token_expires_on,
		@client_id,
		@refresh_token,
		@refresh_token_expires_on,
		@user_id);
END
GO
create or alter proc hq.sp_get_oauth_authorization_code
	@code nvarchar(256)
as
	select client_id,expires,user_id,scope,redirect_uri,
		(SELECT *
		FROM hq.oauth_clients  WHERE client_id=a.client_id for json path, without_array_wrapper) as OAuthClient,
		(SELECT *
		FROM hq.pz_user  WHERE id=a.user_id for json path, without_array_wrapper) as [User]
	from hq.oauth_authorization_codes a
	where authorization_code=@code;
	
GO 
create or alter proc hq.sp_set_oauth_authorization_code
	@client_id nvarchar(80),
    @authorization_code nvarchar(256),
	@user_id int,
    @expires datetime,
    @scope nvarchar(100),
	@redirect_uri  nvarchar(500)
 as 
	insert into hq.oauth_authorization_codes 
	(id,client_id,authorization_code,user_id,expires,scope,redirect_uri)
	values (NEWID(),@client_id,@authorization_code,@user_id,@expires,@scope,@redirect_uri)
GO 
create or alter proc hq.sp_del_oauth_authorization_code
	@code nvarchar(256)
as
	delete
	from hq.oauth_authorization_codes 
	where 1=0;
	--where authorization_code=@code;
GO

CREATE OR ALTER PROCEDURE [hq].[sp_oauth_del_token]
	@token nvarchar(500)
AS
	DELETE FROM hq.oauth_tokens 
	WHERE (access_token=@token  OR refresh_token=@token);